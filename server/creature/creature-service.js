var path = require('path'),
	server = require('../server'),
	io = server.io,
	_ = require('lodash'),
	eventService = require('../event/event-service'),
	userService = require('../user/user-service'),
	dateUtils = require('../utils/date-utils'),
	pool = server.pool,
	async = require('async'),
	moment = require('moment'),
	app = server.app,
	io = server.io;

var recalcCreatureRespTime = function(callback, creatureId) {
	var today = moment().valueOf();
	var creatures = [];
	pool.getConnection(function(err, connection) {
		if(!creatureId) {
			connection.query('select * from creature order by lvl', function (err, rows) {
				if (err) throw err;
				for (var i = 0; i < rows.length; i++) {
					var currentCreature = rows[i];
					var maxRespDate = moment(currentCreature.defeatedDate).add('h', currentCreature.maxRespTime);

					if (moment(maxRespDate).isBefore(today)) {
						currentCreature.timeToResp = null;
					} else {
						var dateDifference = moment(maxRespDate).diff(moment(today));
						currentCreature.timeToResp = dateDifference;
					}
					creatures.push(currentCreature);
				}
				connection.release();
				callback(null, creatures);
			});
		} else {
			connection.query('select * from creature where id = ?', creatureId, function (err, rows) {
				if (err) throw err;

				if (rows.length === 1) {
					var currentCreature = rows[0];
					var maxRespDate = moment(currentCreature.defeatedDate).add('h', currentCreature.maxRespTime);

					if (moment(maxRespDate).isBefore(today)) {
						currentCreature.timeToResp = null;
					} else {
						var dateDifference = moment(maxRespDate).diff(moment(today));
						currentCreature.timeToResp = dateDifference;
					}

					creatures.push(currentCreature);
				} else {
					callback('unknown creature');
				}
				connection.release();
				callback(null, creatures);
			});
		}
	});
};

var checkDefeatDuplicate = function(creature, date, duplicateExistCb, duplicateNotExistCb) {
	var dateFrom = moment(date).subtract(1, 'minutes');

	pool.getConnection(function(err, connection){
		connection.query('select * from report where reportDate between ? and ? and creatureId = ?', [dateUtils.timestampToSqlDatetime(dateFrom.valueOf()), dateUtils.timestampToSqlDatetime(moment(date).valueOf()), creature.id], function(err, rows){
			if(rows.length > 0) {
				connection.release();
				duplicateExistCb();
			} else {
				connection.release();
				duplicateNotExistCb();
			}
		});
	});
};

app.get('/creatures', function(req, res){
	var creatures = [];
	pool.getConnection(function(err, connection) {
		connection.query({
			sql: 'select * from creature',
			timeout: 1000
		}, function(err, rows) {
			if (err) throw err;

			for (var i = 0; i < rows.length; i++) {
				creatures.push(rows[i]);
			}

			connection.release();
			res.send(creatures);
		});
	});
});

var reportDefeatMock = function(date, creature, reporterToken){
	var reportDate = date;

	pool.getConnection(function(err, connection) {

		async.waterfall([
			function(wcb){
				userService.getUserByToken(reporterToken, function(err, user){
					wcb(null, user.id);
				});
			},
			function(userId, wcb){
				var battleSet = {
					creatureId: creature.id,
					reportDate: moment(reportDate).format('YYYY-MM-DD HH:mm:ss'),
					userId: userId
				};

				connection.query('insert into report set ?', battleSet, function (err, rows) {
					if(err) {
						throw(err);
					}

					wcb();
				});
			},
			function(wcb){
				connection.query('update creature set lastSeenDate = ? where id = ?', [dateUtils.timestampToSqlDatetime(reportDate), creature.id], function(err) {
					if(err) {
						throw(err);
					}

					wcb();
				});

			}
		], function(err){
			if(err) {
				//res.status(404).send();
			}

			connection.release();
		});
	});

};

app.post('/reportDefeat', function(req, res){
	var reportDate = req.body.date;
	var creature = req.body.creature;
	var reporterToken = req.body.reporterToken;

	if(reportDate && creature){
		checkDefeatDuplicate(creature, reportDate, function(){
			res.status(404).send({
				message: 'duplicate',
				code: 41
			});
		}, function(){
			pool.getConnection(function(err, connection) {

				async.waterfall([
					function(wcb){
						userService.getUserByToken(reporterToken, function(err, user){
							wcb(null, user.id);
						});
					},
					function(userId, wcb){
						var battleSet = {
							creatureId: creature.id,
							reportDate: moment(reportDate).format('YYYY-MM-DD HH:mm:ss'),
							userId: userId
						};

						connection.query('insert into report set ?', battleSet, function (err, rows) {
							if(err) {
								throw(err);
							}

							wcb();
						});
					},
					function(wcb){
						connection.query('update creature set lastSeenDate = ? where id = ?', [dateUtils.timestampToSqlDatetime(reportDate), creature.id], function(err) {
							if(err) {
								throw(err);
							}

							wcb();
						});

					}
				], function(err){
					if(err) {
						res.status(404).send();
					}

					connection.release();

					recalcCreatureRespTime(function(empty, data) {
						if(empty) {
							res.status(500).send({
								message: empty,
								code: 42
							});
						}

						var output = {
							creatures: data
						};
						io.emit('creaturesUpdated', output);

						eventService.getEvents(function(cb, data){
							io.emit('eventsUpdated', data[0]);
						}, reportDate, reportDate);

						res.status(200).send();
					}, creature.id);
				});
			});
		});
	}
});

var getCreatureByName = function(name, foundCb, notFoundCb){
	pool.getConnection(function(err, connection){

		if(err){
			console.log('err');
			throw(err);
		}
		connection.query('select * from creature where name = ?', name, function(err, rows){
			if(err){
				connection.release();
				notFoundCb();
			}

			if(rows.length === 1){
				connection.release();
				foundCb(rows[0]);
			}
		});
	});
};

module.exports = {
	recalcCreatureRespTime: recalcCreatureRespTime,
	getCreatureByName: getCreatureByName,
	reportDefeatMock: reportDefeatMock
};