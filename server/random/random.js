var server = require('../server'),
	pool = server.pool,
	async = require('async'),
	moment = require('moment'),
	app = server.app,
	_ = require('lodash'),
	io = server.io,
	fs = require('fs'),
	path = require('path'),
	creatures = JSON.parse(fs.readFileSync('random/creatures.json')),
	players = JSON.parse(fs.readFileSync('random/players.json')),
	otherPlayers = JSON.parse(fs.readFileSync('random/other-players-with-lvl.json')),
	dateUtils = require('../utils/date-utils');


var randInt = function(M, N) {
	return Math.floor(M + (1+N-M)*Math.random());
},

randAmount = function(M, N) {
	var amount = M + (N - M) * Math.random()
	return amount.toFixed(2) * 1;
},

randTimestamp = function(daysBack) {
	var date = new Date();

	date.setHours(-24 * randInt(0, daysBack));
	date.setHours(randInt(0, 23));
	date.setMinutes(randInt(0, 59));
	date.setSeconds(randInt(0, 59));
	date.setMilliseconds(0);
	return Math.round(date.getTime());
};


var battleType = ['BATTLE', 'REPORT'];
var creatureService = require('../creature/creature-service');
var eventService = require('../event/event-service');

var randGroupCount = function(creatureType) {
	if(creatureType === 'titan') {
		return randInt(7,10);
	} else {
		return randInt(1,10);
	}
};

var getMorePlayersFromOthers = function(creatureLvl){
	var playersForCreature = [];

	otherPlayers.map(function(elem){
		//if(elem.lvl >= creatureLvl - 83 && elem.lvl <= creatureLvl + 83){
			playersForCreature.push(elem);
		//}
	});

	return playersForCreature;
};

var randPlayersForCreature = function(creatureLvl, howMany) {
	var playersForCreature = [];
	var clanPlayersToOut = [];
	var otherPlayersToOut = [];
	var otherPlayers = [];
	var clanPlayersRawToOut = [];
	players.map(function(elem){
		//if(elem.lvl >= creatureLvl - 53 && elem.lvl <= creatureLvl + 53){
			playersForCreature.push(elem);
		//}
	});

	if(playersForCreature.length < howMany){
		otherPlayers = getMorePlayersFromOthers(creatureLvl);
	}

	//if(playersForCreature && playersForCreature.lengt > 0) {
		for (var i = 0; i < howMany; i++) {
			var randIndex = '';
			if (playersForCreature.length > 0) {
				randIndex = randInt(0, playersForCreature.length - 1);
				clanPlayersToOut.push({
					name:playersForCreature[randIndex].nick,
					lvl: playersForCreature[randIndex].lvl
				});
				clanPlayersRawToOut.push(playersForCreature[randIndex]);
				playersForCreature.splice(randIndex, 1);
			} else {
				randIndex = randInt(0, otherPlayers.length - 1);
				otherPlayersToOut.push({name: otherPlayers[randIndex].nick, lvl: otherPlayers[randIndex].lvl});
				otherPlayers.splice(randIndex, 1);
			}
		}
	//}

	return {
		clanPlayers: clanPlayersToOut,
		otherPlayers: otherPlayersToOut,
		clanPlayersRawToOut: clanPlayersRawToOut
	};
};
app.get('/reportDefeat/:x', function(req, res){
	var x = parseInt(req.params.x, 0);

	for(var i = 0; i < x; i++) {
		var userToken = players[randInt(0, players.length - 1)].mainUserToken;
		var reportCreature = creatures[randInt(0, creatures.length - 1)];
		var date = randTimestamp(10);
		creatureService.reportDefeatMock(date, reportCreature, userToken);
	}

	res.status(200).send();
});

app.get('/registerEventMock/:x', function(req, res){
	var x = parseInt(req.params.x, 0);

	for(var i = 0; i < x; i++){

		var creature = creatures[randInt(0, creatures.length-1)];
		var groupCount = randGroupCount(creature.type);
		var playersForCreature = randPlayersForCreature(creature.lvl, groupCount);
		var reporter = playersForCreature.clanPlayersRawToOut[randInt(0, playersForCreature.clanPlayers.length - 1)];
		var reporterToken = '';
		if(reporter.mainUserToken && !reporter.guestUserToken){
			reporterToken = reporter.mainUserToken;
		} else if (!reporter.mainUserToken && reporter.guestUserToken){
			reporterToken = reporter.guestUserToken;
		} else {
			reporterToken = randInt(1,2) === 1 ? reporter.guestUserToken : reporter.mainUserToken;
		}
		console.log('reporter', reporter);
		var place = 'Mroczny przesmyk';
		var isGuest = reporterToken === reporter.guestUserToken;
		var timestamp = randTimestamp(10);
		var group = playersForCreature.otherPlayers ? playersForCreature.clanPlayers.concat(playersForCreature.otherPlayers) : playersForCreature.clanPlayers.concat;
		console.log('group', group);


		eventService.registerEventMock(reporterToken, reporter.nick, creature.name, isGuest, group, place, timestamp);


	}

	res.status(200).send();
});