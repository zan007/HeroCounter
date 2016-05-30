var path = require('path'),
	server = require('../server'),
	pool = server.pool,
	moment = require('moment'),
	app = server.app,
	io = server.io;

var recalcCreatureRespTime = function(callback) {
	var today = moment().valueOf();
	var creatures = [];
	pool.getConnection(function(err, connection) {
		connection.query({
			sql: 'select * from creature',
			timeout: 1000
		}, function(err, rows) {
			if (err) throw err;

			var currentCreature = '';
			for (var i = 0; i < rows.length; i++) {
				currentCreature = rows[i];

				//var msDate  = moment(rows[i].defeatedDate).valueOf();

				//var minRespDate = moment(currentCreature.defeatedDate).add('h', currentCreature.minRespTime);
				var maxRespDate = moment(currentCreature.defeatedDate).add('h', currentCreature.maxRespTime);
				//console.log('today', moment(minRespDate).format('DD/MM/YYYY HH:mm:ss'), moment(maxRespDate).format('DD/MM/YYYY HH:mm:ss'));
				if(moment(maxRespDate).isBefore(today)) {
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

		pool.query('update creature set defeatedDate = ? where name = ?', [today, creatureName], function(err){
			if(err){
				throw(err);
			}
		});
		pool.query('update creature set defeatCounter = defeatCounter + 1 where name = ?', [creatureName], function(err){
			if(err){
				throw(err);
			}
		});
		recalcCreatureRespTime(function(empty, data) {
			/*console.log('recalc defeat', data);*/
			var output = {
				creatures: data
			};
			console.log('recalc defeat');

			io.emit('creaturesUpdated', output);

			res.send(output);
		});
	} else {
		res.status(404).send('not Found');
	}
});

module.exports = {
	recalcCreatureRespTime: recalcCreatureRespTime
};