var server = require('../server'),
	io = server.io,
	_ = require('lodash'),
	pool = server.pool,
	percentile = require('stats-percentile'),
	async = require('async'),
	moment = require('moment'),
	app = server.app,
	io = server.io;

app.get('/creatureAnalyze', function(req, res){
	if (req.query.creatureId && req.isAuthenticated()) {
		var creature = '',
			observations = [],
			defeatAfterArray = [],
			interval = 30;

		pool.getConnection(function (err, connection) {
			var allEvents = [];
			async.waterfall([
				function (wcb) {
					connection.query('select * from creature where id = ?', req.query.creatureId, function (err, rows) {
						creature = rows[0];
						wcb();
					});
				},
				function (wcb) {
					connection.query('select * from battle where creatureId = ?', req.query.creatureId, function (err, rows) {
						wcb(null, rows);
					});
				}, function (battles, wcb) {
					connection.query('select * from report where creatureId = ?', req.query.creatureId, function (err, rows) {
						allEvents = battles.concat(rows);
						var sortedEvents = allEvents.sort(function (a, b) {
							var aSortField = a.battleDate ? a.battleDate : a.reportDate;
							var bSortField = b.battleDate ? b.battleDate : b.reportDate;

							return aSortField - bSortField;
						});
						wcb(null, sortedEvents);
					});
				}, function (sortedEvents, wcb) {
					for (var i = 0, len = sortedEvents.length; i < len; i++) {
						var currentEventDate =  sortedEvents[i].battleDate ? sortedEvents[i].battleDate : sortedEvents[i].reportDate;
						if(i+1 < len) {
							var nextEventDate = sortedEvents[i + 1].battleDate ? sortedEvents[i + 1].battleDate : sortedEvents[i + 1].reportDate;
						} else {
							break;
						}
						var maxRespTime = moment(currentEventDate).add('h', creature.maxRespTime);

						if (maxRespTime.diff(nextEventDate) > 0) {
							observations.push({
								status: 1,
								defeatAfter: Math.floor((moment(nextEventDate).diff(currentEventDate) / 60000) / interval).toFixed(0)
							});
							defeatAfterArray.push(Math.floor((moment(nextEventDate).diff(currentEventDate) / 60000) / interval).toFixed(0));
						} else {
							observations.push({
								status: 0,
								defeatAfter: Math.floor((creature.maxRespTime * 60) / interval).toFixed(0)
							});
							defeatAfterArray.push(Math.floor((creature.maxRespTime * 60) / interval).toFixed(0));
						}
					}

					wcb();
				}, function(){
					var defeatCountMap = _.countBy(observations, function(obj){
						if(obj.status === 1) {
							return obj.defeatAfter;
						}
					});

					var probabilityArray = [];
					var tempObservationsLen = observations.length;
					var tempProbability = 1;
					var probabilityValues = [];
					delete defeatCountMap['undefined'];

					for(var elem in defeatCountMap) {
						var defeatCount = defeatCountMap[elem];
						var probability = tempProbability * ((tempObservationsLen - defeatCount) / tempObservationsLen);
						probabilityValues.push(probability);
						tempProbability = probability;

						probabilityArray.push({
							'time': parseInt(elem),
							'probability': probability.toFixed(2)
						});
						tempObservationsLen -= defeatCount;

					}

					connection.release();
					res.status(200).send({
						'observations': observations,
						'defeatCountMap': defeatCountMap,
						'probabilityArray': probabilityArray,
						'defeatAfterArray': defeatAfterArray,
						'percintiles': {
							'25': percentile.calc(defeatAfterArray, 25),
							'50': percentile.calc(defeatAfterArray, 50),
							'75': percentile.calc(defeatAfterArray, 75)
						}
					});
				}
			], function (err) {
				connection.release();
				if (err) {
					res.status(404).send();
				}
			});
		});
	}
});

app.get('/creatureProfile', function(req, res) {
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
					connection.query('select count(*) as count from battle where creatureId = ?', creatureId, function (err, rows) {
						if(err) {
							wcb(err);
						}
						
						battleCount = rows[0].count;
						wcb();
					});
				}, function(wcb) {
					connection.query('select count(*) as count from report where creatureId = ?', creatureId, function (err, rows){
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
							connection.query('select * from hero where id = ?', topHeroes[iCopy].heroId, function (err, rows) {
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
				}],
				function(err) {
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