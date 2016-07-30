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

var getPlaceById = function(id, cb){
	pool.getConnection(function (err, connection) {
		connection.query('select * from place where id = ?', id, function(err, rows){
			if (err) {
				throw err;
			}
			if(rows.length > 0) {
				connection.release();
				cb(null, rows);

			} else {
				connection.release();
				cb('unknown place');
			}
		});
	});
}

app.get('/creatureProfile', function(req, res) {
	//console.log('poczatek pobierania profilu', req.params);

	if (req.query.creatureId && req.isAuthenticated()) {
		var creatureId = req.query.creatureId;
		var battleCount = 0,
			reportCount = 0,
			topHeroes = [],
			dateMap = {
				morning: 0,
				afternoon: 0,
				evening: 0,
				night: 0
			},
			placeArray = [],
			placeMap = {};

		pool.getConnection(function (err, connection) {

			async.waterfall([
				function(wcb){
					connection.query('select count(*) as count from battle', function (err, rows) {
						if(err) {
							wcb(err);
						}
						
						battleCount = rows[0].count;
						wcb();
					});
				}, function(wcb) {
					connection.query('select count(*) as count from report', function (err, rows){
						if(err) {
							wcb(err);
						}
						
						reportCount = rows[0].count;
						wcb();
					});	
				}, function(wcb){
					connection.query('select * from hero', function(err, rows){
						if(err) {
							wcb(err);
						}

						wcb(null, rows);
					});
				}, function (heroes, wcb) {
					var heroBattlesCount = [];
					for(var i = 0, len = heroes.length; i < len; i++) {
						(function() {
							var iCopy = i;
							connection.query('select count(*) as battleCount from heroBattle where battleId in (select id from battle where creatureId = ?) AND heroId = ?', [creatureId, heroes[iCopy].id], function (err, rows) {
								if (err) wcb(err);

								if(rows[0].battleCount > 0) {
									heroBattlesCount.push({
										heroId: heroes[iCopy].id,
										battleCount: rows[0].battleCount
									});
								}
								if(iCopy === len-1) {
									wcb(null, heroBattlesCount);
								}
							});
						}());
					}
				}, function(heroBattleCount, wcb){
					var sortedTopHeroes = heroBattleCount.sort(function(a, b){
						return b.battleCount - a.battleCount;
					});
					var topCount = 3;

					if(sortedTopHeroes.length > topCount){
						var howManyElements =  sortedTopHeroes.length - topCount;
						sortedTopHeroes.splice(topCount-1, howManyElements);
					}


					topHeroes = sortedTopHeroes;

					wcb();
				}, function(wcb){
					for(var i = 0, len = topHeroes.length; i < len; i++){
						(function() {
							var iCopy = i;
							connection.query('select * from hero where id = ?', [creatureId, topHeroes[iCopy].heroId], function (err, rows) {
								if (err) wcb(err);

								if(rows.length > 0) {
									topHeroes[iCopy].heroName = rows[0].heroName;
									topHeroes[iCopy].lvl = rows[0].lvl;
									topHeroes[iCopy].guestUserId = rows[0].guestUserId;
									topHeroes[iCopy].mainUserId = rows[0].mainUserId;
								}
							});

						}());
					}

					wcb();
				}, function(wcb){
					connection.query('select * from battle where creatureId = ?', creatureId, function(err, rows){

						for(var i = 0, len = rows.length; i < len; i++) {
							var battleHour = moment(rows[i].battleDate).hours();

							if (battleHour >= 5 && battleHour < 12) {
								dateMap.morning += 1;
							} else if (battleHour >= 12 && battleHour < 17) {
								dateMap.afternoon += 1;
							} else if (battleHour >= 17 && battleHour < 24) {
								dateMap.evening += 1;
							} else if (battleHour >= 5 && battleHour < 12) {
								dateMap.night += 1;
							}
							if(rows[i].placeId) {
								var currentPlaceId = rows[i].placeId;
								if (placeMap[currentPlaceId]) {
									placeMap[currentPlaceId] += 1;
								} else {
									placeMap[currentPlaceId] = 1;
									placeArray.push({
										placeId: currentPlaceId
									});
								}
							}
						}

						wcb();
					});
				}, function(wcb){
					for(var i = 0, len = placeArray.length; i < len; i++){
						(function() {
							var iCopy = i;
							connection.query('select * from place where id = ?', placeArray[iCopy].placeId, function (err, rows) {
								if (err) wcb(err);

								if(rows.length > 0) {
									placeArray[iCopy].placeName = rows[0].name;
								}

								if(iCopy === len-1){
									wcb();
								}
							});


						}());
					}

					/*for(var keys = Object.keys(placeMap), i = 0, end = keys.length; i < end; i++) {
						var key = keys[i];

						getPlaceById(key, function(err, placeRow) {
							if (placeRow){
								placeArray.push({
									placeId: placeRow[0].id,
									placeName: placeRow[0].name
								});
							}

							if(i === end){
								wcb();
							}
						});

						// do what you need to here, with index i as position information
					}*/

				}
				], function(err) {
					connection.release();
					if(err) {
						res.status(404).send();
					}

				var toSend = {
					battlesCount: battleCount,
					reportsCount: reportCount,
					topHeroes: topHeroes,
					dateMap: dateMap,
					places: placeArray
				};

					res.status(200).send(toSend);
			});
		});
	} else {
		res.status(404).send();
	}
});