var server = require('../server'),
	pool = server.pool,
	async = require('async'),
	app = server.app;

var getUser = function(id, cb){
	pool.getConnection(function(err, connection){
		connection.query('select * from user where id = ?', id, function(err, rows){
			if (err) throw err;

			if(rows.length === 1) {
				return cb(null, rows[0]);
			}

		});
	});
};

var getUsersToAccept = function(cb) {
	pool.getConnection(function(err, connection){
		connection.query('select id, email, name, tokenExpirationDate from user where waitForAccept = ?', 1, function(err, rows){
			if (err) {
				cb(err);
			}

			for(var i = 0, len = rows.length; i < len; i++){
				var currentUser = rows[i];
				currentUser.tokenExpirationDate = currentUser.tokenExpirationDate - 7200000;
			}
			return cb(null, rows);
		});

	});
};

var checkAdministrator = function(userId, successCallback, errorCallback) {
	pool.getConnection(function(err, connection){
		connection.query('select * from user where id = ? && isAdministrator = ?', [userId ,true], function(err, rows) {
			if(err) throw err;

			connection.release();
			if(rows.length === 1) {
				successCallback();
			} else {
				errorCallback();
			}

		});
	});
};

app.post('/getUsersToAccept', function(req, res) {
	if(req.body && req.body.userId){
		checkAdministrator(req.body.userId, function(){
			getUsersToAccept(function (err, usersToAccept) {
				if(err) {
					res.status(500).send();
				}
				res.status(200).send(usersToAccept);
			});
		}, function() {
			res.status(500).send();
		});
	}
});

app.post('/activate', function(req, res) {
	console.log('poczatek aktywacji', req.params);
	if(req.body && req.body.token) {
		var token = req.body.token;
		var currentTimestamp = new Date().getTime();

		pool.query('select * from user where activationToken = ? and tokenExpirationDate > ?', [token, currentTimestamp], function(err, rows) {
			if (err) {
				throw err;
			}

			if(rows.length == 1) {
				console.log(rows[0]);
				res.status(200);
				pool.query('update user set activationToken = ? where activationToken = ?', [null, token], function(err) {
					if (err) {
						throw err;
					}

					res.status(200).send();

				});

			} else {
				res.status(404).send('not found');
			}
		});
	} else {
		res.status(404).send('not Found');
	}
});

app.post('/acceptUserActivation', function(req, res) {
	console.log('poczatek akceptacji uzytkownika', req.params);
	if(req.body && req.body.userId) {
		var userId = req.body.userId;

		pool.query('update user set waitForAccept = ? where id = ?', [0, userId], function(err) {
			if (err) {
				throw err;
			}

			getUsersToAccept(function(usersToAccept) {
				res.status(200).send(usersToAccept);
			}, function() {
				res.status(404).send('not Found');
			});

		});
	} else {
		res.status(404).send('not Found');
	}
});

app.post('/rejectUserActivation', function(req, res) {
	console.log('poczatek odrzucania uzytkownika', req.params);
	if(req.body && req.body.userId) {
		var userId = req.body.userId;

		pool.query('update user set waitForAccept = ? where id = ?', [null, userId], function(err) {
			if (err) {
				throw err;
			}

			getUsersToAccept(function(usersToAccept) {
				res.status(200).send(usersToAccept);
			}, function() {
				res.status(404).send('not Found');
			});
		});
	} else {
		res.status(404).send('not Found');
	}
});

module.exports = {
	getUser: getUser,
	getUsersToAccept: getUsersToAccept
};