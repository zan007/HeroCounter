var server = require('../server'),
	pool = server.pool,
	_ = require('lodash'),
	userService = require('./user-service'),
	async = require('async'),
	moment = require('moment'),
	app = server.app;

var getCreatureBattlesCount = function(battles, creatureId){
	var creatureBattleCount = 0;
	for(var i = 0, len = battles.length; i < len; i++){
		if(battles[i].creatureId === creatureId) {
			creatureBattleCount++;
		}
	}

	return creatureBattleCount;
};

var getBattleStats = function(battles, profileModel, guest, cb){
	var statsModel;
	if(guest) {
		statsModel = profileModel.guestHeroStats;
	} else {
		statsModel = profileModel.mainHeroStats;
	}
	var tempCreatureList = {};

	for(var j = 0; j < battles.length; j++) {
		var creatureId = battles[j].creatureId;
		var placeId = battles[j].placeId;

		if(statsModel.creatures.map(function(e) { return e.creatureId; }).indexOf(creatureId) === -1) {
			statsModel.creatures.push({creatureId: creatureId, creatureBattleCount: 0});
		}
		if(statsModel.places.map(function(e) { return e.placeId; }).indexOf(placeId) === -1) {
			statsModel.places.push({placeId: placeId, placeBattleCount: 0});
		}

	}

	for(var i = 0; i < battles.length; i++) {
		var placeId = battles[i].placeId;
		var creatureId = battles[i].creatureId;
		console.log('creatureId', creatureId);
		statsModel.places.forEach(function(place){
			if(place.placeId === placeId) {
				place.placeBattleCount += 1;
			}
		});

		statsModel.creatures.forEach(function(creature){
			if(creature.creatureId === creatureId) {
				creature.creatureBattleCount += 1;
			}
		});

		var battleHour = moment(battles[i].battleDate).hours();

		if (battleHour >= 5 && battleHour < 12) {
			statsModel.dateMap.morning += 1;
		} else if (battleHour >= 12 && battleHour < 17) {
			statsModel.dateMap.afternoon += 1;
		} else if (battleHour >= 17 && battleHour < 24) {
			statsModel.dateMap.evening += 1;
		} else if (battleHour >= 5 && battleHour < 12) {
			statsModel.dateMap.night += 1;
		}

	}

	if(guest) {
		profileModel.guestHeroStats = statsModel;
	} else {
		profileModel.mainHeroStats = statsModel;
	}

	return profileModel;

};

app.get('/getUserProfile', function(req, res) {
	console.log('poczatek pobierania profilu', req.params);
	if(req.param('userId') && req.isAuthenticated()){
		var userId = req.param('userId'),
			profileModel = {};
		pool.getConnection(function(err, connection) {
			async.waterfall([
				function (cb) {
					userService.getUser(userId, function (err, user) {
						if (err) {
							cb(err);
						}
						profileModel.name = user.name;
						profileModel.avatar = user.avatar;
						profileModel.gg = user.ggVisible ? user.gg : null;
						profileModel.phone = user.phoneVisible ? user.phone : null;
						profileModel.isAdministrator = !!user.isAdministrator;
						profileModel.id = user.id;
						cb(null, profileModel);
					});

				},
				function (profileModel, cb) {
					profileModel.mainHeroes = [];
					profileModel.mainHeroStats = {};
					profileModel.mainHeroStats.battles = [];

					connection.query('select * from hero where mainUserId = ?', profileModel.id, function (err, rows) {
						if (err) {
							cb(err);
						}
						if (rows && rows.length > 0) {
							for (var i = 0, len = rows.length; i < len; i++) {
								var currentHero = rows[i];
								profileModel.mainHeroes.push(currentHero);
								profileModel.mainHeroStats.battles.push({
									'heroId': currentHero.id,
									'battleCount': 0
								});
							}
						}

						cb(null, profileModel);
					});

				},
				function (profileModel, cb) {
					profileModel.guestHeroes = [];
					profileModel.guestHeroStats = {};
					profileModel.guestHeroStats.battles = [];

					connection.query('select * from hero where guestUserId = ?', profileModel.id, function (err, rows) {
						if (err) {
							cb(err);
						}
						if (rows && rows.length > 0) {
							for (var i = 0, len = rows.length; i < len; i++) {
								var currentHero = rows[i];
								profileModel.guestHeroes.push(currentHero);
								profileModel.guestHeroStats.battles.push({
									'heroId': currentHero.id,
									'battleCount': 0
								});
							}
						}

						cb(null, profileModel);
					});

				},
				function (profileModel, cb) {
					profileModel.mainHeroStats.places = [];
					profileModel.mainHeroStats.dateMap = {
						morning: 0,
						afternoon: 0,
						evening: 0,
						night: 0
					};
					profileModel.mainHeroStats.summaryBattles= '';
					profileModel.mainHeroStats.creatures = [];
					profileModel.guestHeroStats.summaryBattles= '';
					profileModel.guestHeroStats.places = [];
					profileModel.guestHeroStats.dateMap = {
						morning: 0,
						afternoon: 0,
						evening: 0,
						night: 0
					};
					profileModel.guestHeroStats.creatures = [];

					if (profileModel.mainHeroes.length > 0) {
						var mainHeroIds = [];
						profileModel.mainHeroes.forEach(function (mainHero) {
							mainHeroIds.push(mainHero.id);
						});

						var battleRows = [];

						for(var i = 0; i < mainHeroIds.length; i++) {
							(function() {
								var iCopy = i;
								connection.query('select b.* from heroBattle hb, battle b  where hb.heroId = ? and b.id=hb.battleId', mainHeroIds[iCopy], function (err, rows) {
									if (err) {
										cb(err);
									}

									if (rows && rows.length > 0) {
										battleRows = battleRows.concat(rows);
										profileModel.mainHeroStats.battles.forEach(function(battle){
											if(battle.heroId === mainHeroIds[iCopy]){
												battle.battleCount = battleRows.length;
											}
										});

									}


									if (iCopy === mainHeroIds.length-1) {
										profileModel.mainHeroStats.summaryBattles = battleRows.length;
										var stats = getBattleStats(battleRows, profileModel, false);
										cb(null, stats);
									}
								});
							}());
						}
					} else {
						cb(null, profileModel);
					}

				},
				function (profileModel, cb) {
					if (profileModel.guestHeroes.length > 0) {
						var guestHeroIds = [];
						profileModel.guestHeroes.forEach(function (guestHero) {
							guestHeroIds.push(guestHero.id);
						});

						var battleRows = [];

						for(var i = 0; i < guestHeroIds.length; i++) {
							(function() {
								var iCopy = i;
								connection.query('select b.* from heroBattle hb, battle b  where hb.heroId = ? and b.id=hb.battleId', guestHeroIds[iCopy], function (err, rows) {
									if (err) {
										cb(err);
									}

									if (rows && rows.length > 0) {
										battleRows = battleRows.concat(rows);
										profileModel.guestHeroStats.battles.forEach(function(battle){
											if(battle.heroId === guestHeroIds[iCopy]){
												battle.battleCount = battleRows.length;
											}
										});
									}

									if (iCopy === guestHeroIds.length-1) {
										profileModel.guestHeroStats.summaryBattles = battleRows.length;
										var stats = getBattleStats(battleRows, profileModel, true);
										cb(null, stats);
									}
								});
							}());
						}

					} else {
						cb(null, profileModel);
					}
				},
				function (profileModel, cb) {
					connection.release();
					res.status(200).send(profileModel);
				}
			], function (err, errMessage) {
				connection.release();
				res.status(500).send();
				throw err;
			});
		});
	} else {
		connection.release();
		res.status(404).send('not Found');
	}
});