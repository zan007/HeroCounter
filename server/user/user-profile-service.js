var server = require('../server'),
	pool = server.pool,
	userService = require('./user-service'),
	async = require('async'),
	moment = require('moment'),
	app = server.app;

var getBattleStats = function(heroId, statsModel){


	pool.getConnection(function(err, connection) {
		connection.query('select battleId from heroBattle where heroId = ?', heroId, function (err, rows) {
			if(rows && rows.length > 0) {
				for (var i = 0, len = rows.length; i < len; i++) {
					connection.query('select * from battle where id = ?', rows[i], function (err, rows) {
						for (var j = 0, length = rows.length; j < length; j++) {
							var placeId = rows[j].placeId;
							var creatureId = rows[j].creatureId;

							if (statsModel.placeMap.hasOwnProperty(placeId)) {
								statsModel.placeMap[placeId] += 1;
							} else {
								statsModel.placeMap[placeId] = 1;
							}

							if (statsModel.creatureMap.hasOwnProperty(creatureId)) {
								statsModel.creatureMap[creatureId] += 1;
							} else {
								statsModel.creatureMap[creatureId] = 1;
							}

							var battleHour = moment(rows[j].battleDate).hours();

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
					});
				}
			}
		});
	});

	return statsModel;
};

app.get('/getUserProfile', function(req, res) {
	console.log('poczatek pobierania profilu', req.params);

	if(req.param('userId')){
		var userId = req.param('userId'),
			profileModel = {};

		async.waterfall([
			function(cb){
				userService.getUser(userId, function(err, user){
					profileModel.name = user.name;
					profileModel.avatar = user.avatar;
					profileModel.gg = user.ggVisible ? user.gg : null;
					profileModel.phone = user.phoneVisible ? user.phone : null;
					profileModel.isAdministrator = !!user.isAdministrator;
					profileModel.id = user.id;
				});
				cb(null, profileModel);
			},
			function(profileModel, cb){
				profileModel.mainHeroes = [];

				pool.getConnection(function(err, connection) {
					connection.query('select heroName from hero where mainUserId = ?', profileModel.id, function(err, rows) {
						if (err) {
							cb(err);
						}
						if(rows && rows.length > 0) {
							for (var i = 0, len = rows.length; i < len; i++) {
								var currentHero = rows[i];
								profileModel.mainHeroes.push(currentHero);
							}
						}

						cb(null, profileModel);
					});
				});
			},
			function(profileModel, cb){
				profileModel.guestHeroes = [];
				pool.getConnection(function(err, connection) {
					connection.query('select heroName from hero where guestUserId = ?', profileModel.id, function(err, rows) {
						if (err) {
							cb(err);
						}
						if(rows && rows.length > 0) {
							for (var i = 0, len = rows.length; i < len; i++) {
								var currentHero = rows[i];
								profileModel.guestHeroes.push(currentHero);
							}
						}

						cb(null, profileModel);
					});
				});
			},
			function(profileModel, cb){
				profileModel.mainHeroStats = {};
				profileModel.guestHeroStats = {};
				profileModel.mainHeroStats.placeMap = {};
				profileModel.mainHeroStats.dateMap = {
						morning: 0,
						afternoon: 0,
						evening: 0,
						night: 0
					};
				profileModel.mainHeroStats.creatureMap = {};
				profileModel.guestHeroStats.placeMap = {};
				profileModel.guestHeroStats.dateMap = {
					morning: 0,
					afternoon: 0,
					evening: 0,
					night: 0
				};
				profileModel.guestHeroStats.creatureMap = {};

				if(profileModel.mainHeroes.length > 0) {
					for (var i = 0, len = profileModel.mainHeroes.length; i < len; i++) {
						var currentMainHero = profileModel.mainHeroes[i];

						profileModel.mainHeroStats = getBattleStats(currentMainHero.id, profileModel.mainHeroStats);
					}
				}

				if(profileModel.guestHeroes.length > 0) {
					for (var j = 0, length = profileModel.guestHeroes.length; j < length; j++) {
						var currentGuestHero = profileModel.guestHeroes[j];

						profileModel.guestHeroStats = getBattleStats(currentGuestHero.id, profileModel.guestHeroStats);
					}
				}

				res.status(200).send(profileModel);
			}
		], function(err, errMessage){

		});
	} else {
		res.status(404).send('not Found');
	}
});