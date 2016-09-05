var server = require('../server'),
	pool = server.pool,
	async = require('async'),
	moment = require('moment'),
	app = server.app,
	_ = require('lodash'),
	io = server.io,
	dateUtils = require('../utils/date-utils'),
	creatureService = require('../creature/creature-service');

var getReports = function(cb, fromTimestamp, toTimestamp) {
	var reports = [];

	pool.getConnection(function(err, connection) {
		connection.query('select * from report where reportDate >= ? and reportDate <= ?', [fromTimestamp, toTimestamp], function(err, rows) {
			if(err) throw err;


			//for(var i = 0, len = rows.length; i < len; i++) {
			async.forEachLimit(rows, 1, function(currentReport, reportCallback){

				var creature = '',
					reportDate = currentReport.reportDate,
					reporter = '';

				async.waterfall([

					function(wcb) {
						connection.query('select * from creature where id = ?', currentReport.creatureId, function(err, rows) {
							if(err) wcb(err);

							creature = rows[0];
							wcb();
						});
					},
					function(wcb) {
						connection.query('select * from user where id = ?', currentReport.userId, function(err, rows) {
							if(err) wcb(err);

							if(rows && rows.length === 1){
								reporter = {
									id: rows[0].id,
									avatar: rows[0].avatar,
									name: rows[0].name
								};
							} else {
								wcb(err);
							}

							wcb();
						});
					},
					function(wcb) {
						reports.push({
							id: currentReport.id,
							creature: creature,
							reportDate: reportDate,
							reporter: reporter,
							type: 'REPORT'
						});

						wcb();
					}
				], function (err) {

					reportCallback();
					if (err) throw err;
				});
			}, function(err, result) {

				connection.release();
				cb(null, reports);
				//connection.release();
				//var sortedEvents = _.orderBy(events, ['battleDate'], ['desc']);

				//cb(null, sortedEvents);
			});
		});
	});
};
var getEvents = function(cb, fromTimestamp, toTimestamp) {
	var events = [];

	if(!fromTimestamp && !toTimestamp){
		toTimestamp = new Date().getTime();
		fromTimestamp = moment(fromTimestamp).subtract('d', 3).valueOf();
	}

	pool.getConnection(function(err, connection) {

		var fromDatetime = dateUtils.timestampToSqlDatetime(fromTimestamp);
		var toDatetime = dateUtils.timestampToSqlDatetime(toTimestamp);


		connection.query('select * from battle where battleDate >= ? and battleDate <= ?', [fromDatetime, toDatetime], function(err, rows) {
			if(err) throw err;


			//for(var i = 0, len = rows.length; i < len; i++) {
			async.forEachLimit(rows, 1, function(currentBattle, battleCallback){

				var place = '',
					creature = '',
					battleDate = currentBattle.battleDate,
					group = [];

				async.waterfall([
					function(wcb) {
						if(currentBattle.placeId) {
							connection.query('select * from place where id = ?', currentBattle.placeId, function (err, rows) {
								if (err) wcb(err);

								place = rows[0];
								wcb();
							});
						} else {
							wcb();
						}
					},
					function(wcb) {
						connection.query('select * from creature where id = ?', currentBattle.creatureId, function(err, rows) {
							if(err) wcb(err);

							creature = rows[0];
							wcb();
						});
					},
					function(wcb) {
						connection.query('select hero.* from hero left join heroBattle on heroBattle.heroId = hero.id where heroBattle.battleId = ?', currentBattle.id, function(err, rows) {
							if(err) wcb(err);

							for(var j = 0, len = rows.length; j < len; j++){
								group.push(rows[j]);
							}

							wcb();
						});
					},
					function(wcb) {
						events.push({
							id: currentBattle.id,
							place: place,
							creature: creature,
							battleDate: battleDate,
							group: group,
							type: 'BATTLE'
						});

						wcb();
					}
				], function (err) {

					battleCallback();
					if (err) throw err;
				});
			}, function(err, result) {

				connection.release();
				getReports(function(err, reports){
					var allEvents = reports.concat(events);
					var sortedEvents = allEvents.sort(function(a, b){
						var aSortField = a.type === 'BATTLE' ? a.battleDate: a.reportDate;
						var bSortField = b.type === 'BATTLE' ? b.battleDate: b.reportDate;

						return  bSortField - aSortField;
					});
					//var sortedEvents = _.orderBy(allEvents, ['battleDate', 'reportDate'], ['desc', 'desc']);
					cb(null, sortedEvents);
				}, fromDatetime, toDatetime);
				//connection.release();
				//var sortedEvents = _.orderBy(events, ['battleDate'], ['desc']);

				//cb(null, sortedEvents);
			});
		});

	});
};

app.post('/getEvents', function(req, res) {
	if(req.body) {
		var fromTimestamp = req.body.fromTimestamp;
		var toTimestamp = req.body.toTimestamp;

		getEvents(function (cb, events) {
			res.send(events);
		}, fromTimestamp, toTimestamp);

	}
});

var insertIntoHeroBattle = function(connection, currentHeroName, battleId, userId, guest, cb) {
	connection.query('select id from hero where heroName = ?', currentHeroName, function(err, rows) {
		if (err) cb(err);


		var currentHeroId = '';
		if(rows.length === 1) {
			currentHeroId = rows[0].id;

			//update creature set defeatedDate = ? where id = ?
			if(userId !== null && guest === true){
				connection.query('update hero set guestUserId = ? where id =?', [userId, currentHeroId], function(err){
					if(err) cb(err);
				});
			} else if(userId !== null && guest === false) {
				connection.query('update hero set mainUserId = ? where id =?', [userId, currentHeroId], function(err){
					if(err) cb(err);
				});
			}

			var heroBattleFields = {
				heroId: currentHeroId,
				battleId: battleId
			};

			connection.query('insert into heroBattle set ?', heroBattleFields, function (err) {
				if(err) {
					throw(err);
				}
			});
			/*connection.release();*/
		} else {

			connection.query('insert into hero set ?', {heroName: currentHeroName}, function (err, rows) {
				if (err) {
					cb(err);
				}


				currentHeroId = rows.insertId;

				var heroBattleFields = {
					heroId: currentHeroId,
					battleId: battleId
				};

				connection.query('insert into heroBattle set ?', heroBattleFields, function (err) {
					if(err){
						throw(err);
					}
				});

				if(userId !== null && guest === true){
					connection.query('update hero set guestUserId = ? where id =?', [userId, currentHeroId], function(err){
						if(err) {
							cb(err);
						}
					});
					connection.release();
				} else if(userId !== null && guest === false) {
					connection.query('update hero set mainUserId = ? where id =?', [userId, currentHeroId], function(err){
						if(err) {
							cb(err);
						}
					});
					connection.release();
				}
			});
		}

	});
};

var checkEventDuplicate = function(creature, date, duplicateExistCb, duplicateNotExistCb) {
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

app.post('/registerEvent', function(req, res) {

	if(req.body){
		var token = req.body.token,
			nick = req.body.nick,
			creature = req.body.creature,
			guest = req.body.guest,
			group = req.body.group,
			place = req.body.place,
			timestamp = moment().format('YYYY-MM-DD HH:mm:ss');

		pool.getConnection(function(err, connection) {

			connection.query('select id from user where userToken = ?', token, function(err, rows) {
				if (err) {
					throw err;
				}

				if(rows.length === 1) {
					var userId = rows[0].id;
					var placeId = '';
					var creatureId = '';
					var battleId = '';
					var battleFields = '';


					connection.beginTransaction(function(err) {
						if (err) {
							return connection.rollback(function() {
								throw err;
							});
						}

						async.waterfall([
							function(cb){
								var creatureService = require('../creature/creature-service');
								creatureService.getCreatureByName(creature, function(creatureObj){
									checkEventDuplicate(creatureObj, timestamp, function(){
										cb({}, 'duplicate');
									}, function(){
										cb();
									});
								},function(){
									cb({}, 'creature not found');
								});
							},
							function(cb) {
								connection.query('select id from place where name = ?', place, function(err, rows) {
									if (err) {
										cb(err);
									}

									if(rows && rows.length === 1) {
										placeId = rows[0].id;
										cb();
									} else {
										connection.query('insert into place set ?', {name: place}, function(err, rows) {
											if(err) cb(err);

											placeId = rows.insertId;
											cb();
										});
									}
								});
							},
							function(cb) {
								connection.query('select id from creature where name = ?', creature, function(err, rows) {
									if (err) {
										cb(err);
									}

									if(rows.length === 1) {
										creatureId = rows[0].id;

										connection.query('update creature set defeatedDate = ? where id = ?; update creature set defeatCounter = defeatCounter + 1 where id = ?', [timestamp, creatureId, creatureId], function(err, rows) {
											if(err) {
												cb(err);
											}

											cb();
										});
									} else {
										cb({}, 'unknown creature', 42);
									}
								});
							},
							function(cb) {
								battleFields = {
									creatureId: creatureId,
									battleDate: timestamp,
									placeId: placeId
								};

								connection.query('insert into battle set ?', battleFields, function(err, rows) {
									if (err) cb(err);

									console.log('insert battle');
									battleId = rows.insertId;
									cb();
								});
							},
							function(cb) {
								for(var i = 0, len = group.length; i < len; i++) {
									var currentHeroName = group[i];
									console.log(currentHeroName);
									if(currentHeroName === nick) {
										insertIntoHeroBattle(connection, currentHeroName, battleId, userId, guest, cb);
									} else {
										insertIntoHeroBattle(connection, currentHeroName, battleId, null, null, cb);
									}
								}
								connection.commit(function(err) {
									if (err) cb(err);
									var creatureService = require('../creature/creature-service');

									creatureService.recalcCreatureRespTime(function(empty, data) {
										var output = {
											creatures: data
										};


										io.emit('creaturesUpdated', output);

										getEvents(function(cb, data){
											console.log('getEvents po dodaniu', data);
											io.emit('eventsUpdated', data[0]);
										}, timestamp, timestamp);

										res.status(200).send({
											message: 'Dodano informację',
										});
									}, creatureId);


								});

							}
						], function (err, errorMessage, errCode) {

							return connection.rollback(function() {

								if(!errorMessage) {
									connection.release();
									throw err;
								} else {

									connection.release();
									res.status(500).send({
										message: errorMessage,
										code: errCode
									});
								}
							});
						});
					});
				} else {
					connection.release();
					res.status(404).send();
				}
			});
		});
	} else {
		res.status(404).send();
	}
});

module.exports = {
	getEvents: getEvents
};