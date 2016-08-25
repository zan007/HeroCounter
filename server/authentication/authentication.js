
var bcrypt = require('bcrypt-nodejs'),
	server = require('../server'),
	pool = server.pool,
	crypto = require('crypto'),
	databaseConfig = require('./../config/database'),
	mysql = require('mysql'),
	LocalStrategy = require('passport-local').Strategy,
	mailer = require('./../mailer');
//var connection = mysql.createConnection(databaseConfig.details);
console.log('duuuuuuuuuupa', pool);
/*if(process.argv[2] === 'remote') {
    pool = mysql.createPool({
      connectionLimit: 50,
      host: databaseConfig.details.host,
      user: databaseConfig.details.user,
      password: databaseConfig.details.password,
      database: databaseConfig.details.database
    });
    console.log('remote');
} else {
    pool = mysql.createPool({
      connectionLimit: 5,
      host: databaseConfig.homeDetails.host,
      user: databaseConfig.homeDetails.user,
      password: databaseConfig.homeDetails.password,
      database: databaseConfig.homeDetails.database
    });
}*/

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

			console.log('administratorzy: ', administrators);
			if (administrators.length > 0) {
				mailer.sendActivationReminder(newUserName, administrators, req);
			}
		});
	});
};

module.exports = function(passport) {
	passport.serializeUser(function(user, done) {
		console.log('serializacja ',user);
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
		console.log('TUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU ', req.body);
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
								console.log('poczatek rejestracji', newUser);
								mailer.sendRegisterLink(activationToken, newUser, req);
								connection.query('insert into user set ?', newUser, function(error, rows2){
									if (error) throw error;

									newUser.id = rows2.insertId;
									sendActivationReminder(newUser.name, req);
									/*connection.query('select email from user where isAdministrator = ?', 1, function(error, rows) {
									 if (error) throw error;

									 var administrators = [];
									 for(var i = 0, len = rows.length; i < len; i++) {
									 administrators.push(rows[i].email);
									 }

									 console.log('administratorzy: ', administrators);
									 if(administrators.length > 0) {
									 mailer.sendActivationReminder(newUser.name, administrators, req);
									 }
									 });*/

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
		console.log('poczatek logownaia');
		pool.getConnection(function(err, connection) {
			connection.query('SELECT * FROM user WHERE login = ?', [login], function(err,rows){
				if (err)
					return done(err);

				if (!rows.length) {
					console.log('authentication failuer');
					return done(null, false, {
						message: 'authentication failured',
						code: 11
					});
				} 
				
				bcrypt.compare(password, rows[0].password, function(err, res){
					if(!res){
						console.log('wrong password but login ok');
						connection.release();
						return done(null, false, {
							message: 'Wrong password, please try again',
							code: 12
						});
					} else {
						connection.query('SELECT * FROM user WHERE login = ? AND activationToken IS NULL', [login], function(err, rows) {
							if(err) {
								console.log('dupa dupa', err);
								return done(err);
							}

							if(rows.length === 1) {
								console.log(rows.length);
								connection.query('SELECT * FROM user WHERE login = ? AND waitForAccept = ?', [login, 0], function(err, rows) {
									if(err) {
										console.log('dupa dupa', err);
										return done(err);
									}
									if(rows.length === 1) {
										connection.release();
										return done(null, rows[0]);
									} if(rows.length === 0) {
										console.log('Before log in your account must be accepted by administrator. ' +
											'We send email to him to make it faster. If your account will be accepted we inform you by email');
										connection.release();
										return done(null, false, {
											persistence: true,
											code: 14,
											message: 'Before log in your account must be accepted by administrator. We send email to him to make it faster. If your account will be accepted we inform you via email'});
									}

								});

							} else if(rows.length === 0) {
								console.log('Before log in please click activation link from email');
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