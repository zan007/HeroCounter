path = require('path');
var bcrypt   = require('bcrypt-nodejs');
var databaseConfig = require('./config/database');
var mysql = require('mysql');
var LocalStrategy = require('passport-local').Strategy;
//var connection = mysql.createConnection(databaseConfig.details);
var pool  = mysql.createPool({
  connectionLimit: 50,
  host: databaseConfig.details.host,
  user: databaseConfig.details.user,
  password: databaseConfig.details.password,
  database: databaseConfig.details.database
});
var generateHash = function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
}

var validPassword = function(password) {
	return bcrypt.compareSync(password, this.local.password);
}



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
						return done(null, false, req.flash('signupMessage', 'That login is already taken.'));
					} else {
						var registerData = req.body;
						var newUser = {
							login: login,
							password: generateHash(password),
							name: registerData.name,
							margoNick: registerData.margoNick
						};
						console.log('poczatek rejestracji');
						connection.query('insert into user set ?', newUser, function(error, rows2){
							if (error) throw error;

							newUser.id = rows2.insertId;
							return done(null, newUser);
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
					console.log('authentication failuer');
					return done(null, false, {message: 'authentication failured'});//req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
				} 
				
				bcrypt.compare(password, rows[0].password, function(err, res){
					if(!res){
						console.log('wrong password but login ok');
						return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
					} else {
						return done(null, rows[0]);
					}
				});
				connection.release();
			});
		});
	}));
};