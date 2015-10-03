path = require('path');
var bcrypt   = require('bcrypt-nodejs');
var databaseConfig = require('./config/database');
var mysql = require('mysql');
var LocalStrategy = require('passport-local').Strategy;
var connection = mysql.createConnection(databaseConfig.details);

var generateHash = function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
}

var validPassword = function(password) {
	return bcrypt.compareSync(password, this.local.password);
}



module.exports = function(passport) {
    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
    	console.log('uuuuhhu');
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
    	console.log('opopopo');
        connection.query('select * from user where id = ?', [id], function(err,rows){	
			done(err, rows[0]);
		});
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'login',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, login, password, done) {
        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(function() {

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
       	connection.query('select * from user where login = ?', login, function(err, rows){
			if (err)
                return done(err);

			 if (rows.length > 0) {
			 	console.log('that login is already taken.');
                return done(null, false, req.flash('signupMessage', 'That login is already taken.'));
            } else {

				// if there is no user with that email
                // create the user
                var newUser = {
                	login: login,
                	password: generateHash(password),
                	name: 'test',
                	margoNick: 'margonick'

                };
				
				connection.query('insert into user set ?', newUser, function(error, rows2){
					console.log(rows2);
					if (error) throw error;

					newUser.id = rows2.insertId;
					return done(null, newUser); // to pewnie niepotrzebne
				});	
            }	
		});

        });

    }));

};