var server = require('../server'),
	pool = server.pool,
	async = require('async'),
	moment = require('moment'),
	app = server.app,
	_ = require('lodash'),
	io = server.io,
	dateUtils = require('../utils/date-utils'),
	creatureService = require('../creature/creature-service');


var getEvents = function(cb, fromTimestamp, toTimestamp) {
	var events = [];
	console.log('getEfents w srodku ',fromTimestamp, toTimestamp);
	pool.getConnection(function(err, connection) {
		if(!fromTimestamp && !toTimestamp){
			toTimestamp = new Date().getTime();
			fromTimestamp = moment(fromTimestamp).subtract('d', 10).valueOf();
		}
		var fromDatetime = dateUtils.timestampToSqlDatetime(fromTimestamp);
		var toDatetime = dateUtils.timestampToSqlDatetime(toTimestamp);
		console.log('from ',fromDatetime,' to: ',toDatetime);

		connection.query('select * from battle where battleDate >= ? and battleDate <= ?', [fromDatetime, toDatetime], function(err, rows) {
			if(err) throw err;

			console.log('query events');
			//for(var i = 0, len = rows.length; i < len; i++) {
			async.forEachLimit(rows, 1, function(currentBattle, battleCallback){
				console.log('foreach ', currentBattle);
				var place = '',
					creature = '',
					battleDate = currentBattle.battleDate,
					group = [];

				async.waterfall([
					function(wcb) {
						connection.query('select * from place where id = ?', currentBattle.placeId, function(err, rows) {
							if(err) wcb(err);

							place = rows[0];
							wcb();
						});
					},
					function(wcb) {
						connection.query('select * from creature where id = ?', currentBattle.creatureId, function(err, rows) {
							if(err) wcb(err);

							creature = rows[0];
							wcb();
						});
					},
					function(wcb) {
						connection.query('select hero.* from hero left join heroBattle on heroBattle.heroId = hero.id and herobattle.id = ?', currentBattle.id, function(err, rows) {
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
							group: group
						});

						wcb();
					}
				], function (err) {
					console.log('przed battleCallback', events);
					battleCallback();
					if (err) throw err;
				});
			}, function(err, result) {
				console.log('po battleCallback', events, result);
				connection.release();
				var sortedEvents = _.orderBy(events, ['battleDate'], ['desc']);

				cb(null, sortedEvents);
			});
		});
	});
};

app.get('/getEvents', function(req, res) {
	if(req.body) {
		var fromTimestamp = req.body.from;
		var toTimestamp = req.body.to;
		var events = getEvents(fromTimestamp, toTimestamp);

		res.send(events);
	}
});

var insertIntoHeroBattle = function(connection, currentHeroName, battleId, userId, guest, cb) {
	connection.query('select id from hero where heroName = ?', currentHeroName, function(err, rows) {
		if (err) cb(err);

		console.log('for hero');
		var currentHeroId = '';
		if(rows.length === 1) {
			currentHeroId = rows[0].id;
			console.log('znalazlem currentheroid', currentHeroId);
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
			console.log('herobattle', heroBattleFields);
			connection.query('insert into heroBattle set ?', heroBattleFields, function (err) {
				if(err) {
					throw(err);
				}
			});
			connection.release();
		} else {
			console.log('dupa', currentHeroName);
			connection.query('insert into hero set ?', {heroName: currentHeroName}, function (err, rows) {
				if (err) {
					cb(err);
				}

				console.log('insert into hero new', rows);
				currentHeroId = rows.insertId;
				console.log('currentHeroId', currentHeroId);
				var heroBattleFields = {
					heroId: currentHeroId,
					battleId: battleId
				};
				console.log('herobattle', heroBattleFields);
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

					console.log('select user', timestamp);
					connection.beginTransaction(function(err) {
						if (err) {
							return connection.rollback(function() {
								throw err;
							});
						}

						async.waterfall([
							function(cb) {
								connection.query('select id from place where name = ?', place, function(err, rows) {
									if (err) {
										cb(err);
									}

									if(rows.length === 1) {
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
										cb({}, 'unknown creature');
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

									console.log('success!');
									connection.release();
									creatureService.recalcCreatureRespTime(function(empty, data) {
										/*console.log('recalc defeat', data);*/
										var output = {
											creatures: data
										};
										console.log('recalc defeat');

										io.emit('creaturesUpdated', output);

										getEvents(function(cb, data){
											console.log('getEvents po dodaniu', data);
											io.emit('eventsUpdated', data[0]);
										}, timestamp, timestamp);

										res.status(200).send(output);
									});


								});

							}
						], function (err, errorMessage) {
							console.log('zwykly err');
							return connection.rollback(function() {
								console.log('rollback');
								if(!errorMessage) {
									connection.release();
									throw err;
								} else {
									console.log('errorMessage: ', errorMessage);
									connection.release();
									res.status(500).send({message: errorMessage});
								}
							});
						});
					});
				} else {
					connection.release();
					res.status(500).send({message: 'unknown token'});
				}
			});
		});
	}
});

module.exports = {
	getEvents: getEvents
};