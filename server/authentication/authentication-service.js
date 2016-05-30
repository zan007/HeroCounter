/**
 * Created by pplos on 25.05.2016.
 */
var passport = require('passport'),
	path = require('path'),
	bcrypt = require('bcrypt-nodejs'),
	server = require('../server'),
	pool = server.pool,
	app = server.app;

app.post('/signup', passport.authenticate('local-signup', {
	failureRedirect : '/register', // redirect back to the signup page if there is an error
	failureFlash : true // allow flash messages
}), function(req, res){
	console.log('rejestracja poprawnie');
	req.logOut();
	res.sendfile(path.join(server.dirName, server.srcDir, 'index.html'));
});

app.post('/login', function(req, res, next) {
	passport.authenticate('local-login', function(err, user, info) {
		console.log('/login', user);
		if(err) {
			return next(err);
		}
		if(!user) {
			console.log('500');
			return res.status(500).send(info);
			//return next(err);
		}
		req.login(user, function(err) {
			if (err) {
				console.log('req.login error');
				return next(err);
				//res.status(500).send(info);
			}

			console.log('logowanie poprawnie ');
			res.sendfile(path.join(server.dirName, server.srcDir, 'index.html'));
		});
	})(req, res, next);
});

app.get('/logout', function(req, res) {
	console.log('logout');
	req.logOut();
	req.session.destroy(function (err) {
		if(err){
			throw(err);
		}
		res.send(200);
	});
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
						res.status(500).send();
					}
				});
			} else {
				res.status(500).send({message: 'wrong old password'});
			}
		});
	} else {
		res.status(500).send();
	}
});