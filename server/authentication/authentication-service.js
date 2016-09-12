/**
 * Created by pplos on 25.05.2016.
 */
var passport = require('passport'),
	bcrypt = require('bcrypt-nodejs'),
	server = require('../server'),
	pool = server.pool,
	app = server.app;

app.post('/signup', function(req, res, next){
	passport.authenticate('local-signup', function(err, user, info){
		if(err) {
			return next(err);
		}

		if(!user) {
			return res.status(500).send(info);
		}

		req.logOut();
		res.status(200).send();
	})(req, res, next);
});

app.post('/login', function(req, res, next) {
	passport.authenticate('local-login', function(err, user, info) {
		if(err) {
			return next(err);
		}

		if(!user) {
			return res.status(500).send(info);
		}

		req.login(user, function(err) {
			if (err) {
				return next(err);
			}

			res.status(200).send();
		});
	})(req, res, next);
});

app.get('/logout', function(req, res) {
	req.logOut();
	req.session.destroy(function (err) {
		if(err){
			throw(err);
		}
		res.send(200);
	});
});

app.get('/isLoggedIn', function(req, res) {
	res.send(req.isAuthenticated()? req.user : {});
});

app.post('/changePassword', function(req, res) {
	if(req.body){
		var newPasswordPlain = req.body.newPassword,
			oldPassword = req.body.oldPassword,
			userId = req.body.userId;

		bcrypt.compare(oldPassword, req.user.password, function(err, result){
			if(result){
				var newPasswordHash = bcrypt.hashSync(newPasswordPlain, bcrypt.genSaltSync(8), null);

				pool.getConnection(function(err, connection){
					if(req.user.id === userId) {
						connection.query('update user set password = ? where id = ?', [newPasswordHash, userId], function (err) {
							if (err) {
								throw err;
							}

							req.user.password = newPasswordHash;
							res.status(200).send(req.user);
							connection.release();

						});
					} else {
						connection.release();
						res.status(500).send();
					}
				});
			} else {
				res.status(500).send({
					code: 31,
					message: 'wrong old password'
				});
			}
		});
	} else {
		res.status(500).send();
	}
});