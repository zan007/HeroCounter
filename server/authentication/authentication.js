var bcrypt = require('bcrypt-nodejs'),
	server = require('../server'),
	pool = server.pool,
	crypto = require('crypto'),
	LocalStrategy = require('passport-local').Strategy,
	mailer = require('./../utils/mailer');


var generateHash = function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

var generateToken = function() {
	return crypto.randomBytes(48).toString('hex');
};

var sendActivationReminder = function(newUserName, req) {
	pool.getConnection(function(err, connection) {
		connection.query('select email from user where isAdministrator = ?', 1, function (error, rows) {
			if (error) throw error;

			var administrators = [];
			for (var i = 0, len = rows.length; i < len; i++) {
				administrators.push(rows[i].email);
			}

			if (administrators.length > 0) {
				mailer.sendActivationReminder(newUserName, administrators, req);
			}
		});
	});
};

module.exports = function(passport) {
	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});
	passport.deserializeUser(function(id, done) {
		pool.getConnection(function(err, connection) {
			connection.query('select * from user where id = ?', [id], function(err,rows){	
				done(err, rows[0]);
				connection.release();
			});
			
		});
	});

	passport.use('local-signup', new LocalStrategy({
		usernameField : 'login',
		passwordField : 'password',
		passReqToCallback : true
	},
	function(req, login, password, done) {
		process.nextTick(function() {
			pool.getConnection(function(err, connection) {
				connection.query('select * from user where login = ?', login, function(err, rows){
					if (err)
						return done(err);

					if (rows.length > 0) {
						return done(null, false, {
							message: 'That login is already taken.',
							code: 21,
							persistence: true
						});
					} else {
						connection.query('select * from user where name = ?', req.body.name, function(err, rows){
							if(rows.length > 0){
								return done(null, false, {
									message: 'That name is already taken.',
									code: 22,
									persistence: true
								});
							} else {
								var timestamp = new Date().getTime();
								var tokenExpirationDate = timestamp + 7200000;
								var activationToken = generateToken();
								var userToken = generateToken();
								var registerData = req.body;
								var newUser = {
									login: login,
									password: generateHash(password),
									name: registerData.name,
									email: registerData.email,
									activationToken: activationToken,
									tokenExpirationDate: tokenExpirationDate,
									userToken: userToken
								};

								mailer.sendRegisterLink(activationToken, newUser, req);
								connection.query('insert into user set ?', newUser, function(error, rows2){
									if (error) throw error;

									newUser.id = rows2.insertId;
									sendActivationReminder(newUser.name, req);
									return done(null, newUser);
								});
							}
						});
					}
					connection.release();	
				});
			});

		});

	}));

	passport.use('local-login', new LocalStrategy({
		usernameField : 'login',
		passwordField : 'password',
		passReqToCallback : true 
	},
	function(req, login, password, done) {
		pool.getConnection(function(err, connection) {
			connection.query('SELECT * FROM user WHERE login = ?', [login], function(err,rows){
				if (err)
					return done(err);

				if (!rows.length) {
					return done(null, false, {
						message: 'authentication failured',
						code: 11
					});
				} 
				
				bcrypt.compare(password, rows[0].password, function(err, res){
					if(!res){
						connection.release();
						return done(null, false, {
							message: 'Wrong password, please try again',
							code: 12
						});
					} else {
						connection.query('SELECT * FROM user WHERE login = ? AND activationToken IS NULL', [login], function(err, rows) {
							if(err) {
								return done(err);
							}

							if(rows.length === 1) {
								connection.query('SELECT * FROM user WHERE login = ? AND waitForAccept = ?', [login, 0], function(err, rows) {
									if(err) {
										return done(err);
									}

									if(rows.length === 1) {
										connection.release();
										return done(null, rows[0]);
									} if(rows.length === 0) {
										connection.release();
										return done(null, false, {
											persistence: true,
											code: 14,
											message: 'Before log in your account must be accepted by administrator. We send email to him to make it faster. If your account will be accepted we inform you via email'
										});
									}

								});
							} else if(rows.length === 0) {
								connection.release();
								return done(null, false, {
									code: 13,
									persistence: true,
									message: 'Please activate account by click in activation link from email before login'
								});
							}
						});
					}
				});
			});
		});
	}));
};