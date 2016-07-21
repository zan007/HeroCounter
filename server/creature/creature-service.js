var path = require('path'),
	server = require('../server'),
	io = server.io,
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
			connection.query('select * from creature', function (err, rows) {
				if (err) throw err;

				for (var i = 0; i < rows.length; i++) {
					var currentCreature = rows[i];

					//var msDate  = moment(rows[i].defeatedDate).valueOf();

					//var minRespDate = moment(currentCreature.defeatedDate).add('h', currentCreature.minRespTime);
					var maxRespDate = moment(currentCreature.defeatedDate).add('h', currentCreature.maxRespTime);
					//console.log('today', moment(minRespDate).format('DD/MM/YYYY HH:mm:ss'), moment(maxRespDate).format('DD/MM/YYYY HH:mm:ss'));
					if (moment(maxRespDate).isBefore(today)) {
						console.log('stare');
						currentCreature.timeToResp = null;
					} else {
						/* console.log(maxRespDate > today);
						 console.log('oooo ' + moment(maxRespDate).format('DD/MM/YYYY HH:mm:ss'));
						 console.log('today format ' + moment(today).format('DD/MM/YYYY HH:mm:ss'));
						 console.log('dzis', moment(today, 'DD/MM/YYYY HH:mm:ss').diff(moment(maxRespDate, 'DD/MM/YYYY HH:mm:ss')));*/

						var dateDifference = moment(maxRespDate).diff(moment(today));
						//  console.log(moment(dateDifference).valueOf());
						currentCreature.timeToResp = dateDifference;
					}
					//console.log(currentCreature, 'ddoodododod');
					creatures.push(currentCreature);
				}
				connection.release();
				callback(null, creatures);
			});
		} else {
			connection.query('select * from creature where id = ?',creatureId, function (err, rows) {
				if (err) throw err;

				if (rows.length === 1) {

					var currentCreature = rows[0];

					//var msDate  = moment(rows[i].defeatedDate).valueOf();

					//var minRespDate = moment(currentCreature.defeatedDate).add('h', currentCreature.minRespTime);
					var maxRespDate = moment(currentCreature.defeatedDate).add('h', currentCreature.maxRespTime);
					//console.log('today', moment(minRespDate).format('DD/MM/YYYY HH:mm:ss'), moment(maxRespDate).format('DD/MM/YYYY HH:mm:ss'));
					if (moment(maxRespDate).isBefore(today)) {
						console.log('stare');
						currentCreature.timeToResp = null;
					} else {
						/* console.log(maxRespDate > today);
						 console.log('oooo ' + moment(maxRespDate).format('DD/MM/YYYY HH:mm:ss'));
						 console.log('today format ' + moment(today).format('DD/MM/YYYY HH:mm:ss'));
						 console.log('dzis', moment(today, 'DD/MM/YYYY HH:mm:ss').diff(moment(maxRespDate, 'DD/MM/YYYY HH:mm:ss')));*/

						var dateDifference = moment(maxRespDate).diff(moment(today));
						//  console.log(moment(dateDifference).valueOf());
						currentCreature.timeToResp = dateDifference;
					}
					//console.log(currentCreature, 'ddoodododod');
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
		connection.query('select * from battle where battleDate between ? and ? and creatureId = ?', [dateUtils.timestampToSqlDatetime(dateFrom.valueOf()), dateUtils.timestampToSqlDatetime(moment(date).valueOf()), creature.id], function(err, rows){
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
				/*console.log(rows[i]);*/
				creatures.push(rows[i]);
			}

			//console.log(creatures);
			connection.release();
			res.send(creatures);
		});
	});
});

app.post('/defeat', function(req, res){
	var today = moment().format('YYYY-MM-DD HH:mm:ss');
	if(req.body && req.body.creatureName) {
		var creatureName = req.body.creatureName;
		var defeatedCreature = '';

		pool.query('update creature set defeatedDate = ? where name = ?', [today, creatureName], function(err){
			if(err){
				throw(err);
			}
		});
		pool.query('update creature set defeatCounter = defeatCounter + 1 where name = ?', [creatureName], function(err, result){
			if(err){
				throw(err);
			}

			defeatedCreature = result.insertId;
		});
		recalcCreatureRespTime(function(empty, data) {
			/*console.log('recalc defeat', data);*/
			var output = {
				creatures: data
			};
			console.log('recalc defeat');

			io.emit('creaturesUpdated', output);

			res.send(output);
		}, defeatedCreature.id);
	} else {
		res.status(404).send('not Found');
	}
});

app.post('/reportDefeat', function(req, res){
	var reportDate = req.body.date;
	var creature = req.body.creature;
	var reporterToken = req.body.reporterToken;

	if(reportDate && creature){
		checkDefeatDuplicate(creature, reportDate, function(){
			res.status(200).send({message: 'duplicate'});
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
				], function(){
					//koniec
					connection.release();

					recalcCreatureRespTime(function(empty, data) {
						/*console.log('recalc defeat', data);*/
						var output = {
							creatures: data
						};
						console.log('recalc defeat');

						io.emit('creaturesUpdated', output);

						eventService.getEvents(function(cb, data){
							console.log('getEvents po dodaniu', data);
							io.emit('eventsUpdated', data[0]);
						}, reportDate, reportDate);

						res.status(200).send();
					}, creature.id);
				});
			});
		});
	}
});

module.exports = {
	recalcCreatureRespTime: recalcCreatureRespTime
};