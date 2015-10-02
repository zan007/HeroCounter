path = require('path');
var bcrypt   = require('bcrypt-nodejs');
var LocalStrategy = require('passport-local').Strategy;

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
        connection.query("select * from user where id = ?", [id], function(err,rows){	
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
    	console.log('ocococ');
        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(function() {

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
       	connection.query("select * from user where login = ?", [login], function(err,rows){
			console.log(rows);
			console.log("above row object");
			if (err)
                return done(err);
			 if (rows.length) {
                return done(null, false, req.flash('signupMessage', 'That login is already taken.'));
            } else {

				// if there is no user with that email
                // create the user
                var newUser = {
                	login: login,
                	password: generateHash(password) 
                };
			
				connection.query("INSERT INTO user ( login, password ) values (?, ?)", [newUser.login, newUser.password], function(err,rows){
					if(rows.length) {
						newUser.id = rows[0].id;
						return done(null, newUser); // to pewnie niepotrzebne
					} else {
						throw err;
					}
				});	
            }	
		});

        });

    }));

};