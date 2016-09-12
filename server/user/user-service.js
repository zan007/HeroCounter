var server = require('../server'),
	pool = server.pool,
	async = require('async'),
	app = server.app;

var getUser = function(id, cb){
	pool.getConnection(function(err, connection){
		connection.query('select * from user where id = ?', id, function(err, rows){
			if (err) throw err;

			connection.release();
			if(rows.length === 1) {
				return cb(null, rows[0]);
			} else {
				return cb(err);
			}

		});
	});
};

var getUserByToken = function(token, cb) {
	pool.getConnection(function(err, connection){
		connection.query('select * from user where userToken = ?', token, function(err, rows){
			if (err) throw err;

			connection.release();
			if(rows.length === 1) {
				return cb(null, rows[0]);
			} else {
				return cb(err);
			}

		});
	});
};

var getUsers = function(cb) {
	pool.getConnection(function(err, connection){
		connection.query('select id, email, name, tokenExpirationDate, isAdministrator, waitForAccept, avatar from user', 1, function(err, rows){
			if (err) {
				cb(err);
			}

			connection.release();
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
		connection.query('select * from user where userToken = ? && isAdministrator = ?', [userId ,true], function(err, rows) {
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

app.post('/getUsers', function(req, res) {
	if(req.body && req.body.userToken){
		checkAdministrator(req.body.userToken, function(){
			getUsers(function (err, users) {
				if(err) {
					res.status(500).send();
				}
				res.status(200).send(users);
			});
		}, function() {
			res.status(500).send();
		});
	} else {
		res.status(404).send();
	}
});

app.post('/setLanguage', function(req, res){

	if(req.body && req.body.lang) {
		var lang = req.param('lang');
		req.session.lang = lang;
		req.session.save();
		res.status(200).send();
	} else {
		res.status(404).send();
	}
});

app.get('/getLanguage', function(req, res){
	res.send(req.session.lang ? req.session.lang : 'pl');
});

app.post('/activate', function(req, res) {
	if(req.body && req.body.token){
		var token = req.body.token;
		var currentTimestamp = new Date().getTime();

		pool.query('select * from user where activationToken = ? and tokenExpirationDate > ?', [token, currentTimestamp], function (err, rows) {
			if (err) {
				throw err;
			}

			if (rows.length === 1) {
				console.log(rows[0]);
				res.status(200);
				pool.query('update user set activationToken = ? where activationToken = ?', [null, token], function (err) {
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
	if(req.body && req.body.userToken && req.body.userId) {
		checkAdministrator(req.body.userToken, function() {
			var userId = req.body.userId;

			pool.query('update user set waitForAccept = ? where id = ?', [0, userId], function(err) {
				if (err) {
					throw err;
				}

				getUsers(function(err, users) {
					if(err) {
						res.status(404).send('not found');
					}

					res.status(200).send(users);
				});
			});
		}, function() {
			res.status(500).send();
		});
	} else {
		res.status(404).send('not Found');
	}
});

app.post('/rejectUserActivation', function(req, res) {
	if(req.body && req.body.userToken && req.body.userId) {
		checkAdministrator(req.body.userToken, function() {
			var userId = req.body.userId;

			pool.query('update user set waitForAccept = ? where id = ?', [null, userId], function(err) {
				if (err) {
					throw err;
				}

				getUsers(function(err, users) {
					if(err) {
						res.status(404).send('not found');
					}
					res.status(200).send(users);
				});
			});
		}, function() {
			res.status(500).send();
		});
	} else {
		res.status(404).send('not Found');
	}
});

app.post('/setAdministrator', function(req, res) {
	if(req.body && req.body.userToken && req.body.userId) {
		checkAdministrator(req.body.userToken, function() {
			var userId = req.body.userId;

			pool.query('update user set isAdministrator = ? where id = ?', [1, userId], function(err) {
				if (err) {
					throw err;
				}

				getUsers(function(err, users) {
					if(err) {
						res.status(404).send('not found');
					}

					res.status(200).send(users);
				});
			});
		}, function() {
			res.status(500).send();
		});
	} else {
		res.status(404).send('not Found');
	}
});

app.post('/setCommonUser', function(req, res) {
	if(req.body && req.body.userToken && req.body.userId) {
		checkAdministrator(req.body.userToken, function() {
			var userId = req.body.userId;

			pool.query('update user set isAdministrator = ? where id = ?', [0, userId], function(err) {
				if (err) {
					throw err;
				}

				getUsers(function(err, users) {
					if(err) {
						res.status(404).send('not found');
					}

					res.status(200).send(users);
				});
			});
		}, function() {
			res.status(500).send();
		});
	} else {
		res.status(404).send('not Found');
	}
});

module.exports = {
	getUser: getUser,
	getUsers: getUsers,
	getUserByToken: getUserByToken
};