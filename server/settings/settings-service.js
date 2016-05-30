var server = require('../server'),
	pool = server.pool,
	async = require('async'),
	app = server.app,
	cloudinaryUtils = require('../utils/cloudinary-utils'),
	userService = require('../user/user-service');

app.post('/applySettings', function(req, res) {
	if(req.body) {
		var phoneNumber = req.body.phoneNumber,
			phoneVisible = req.body.phoneVisible,
			ggVisible = req.body.ggVisible,
			ggNumber = req.body.ggNumber,
			name = req.body.name,
			userId = req.body.userId;

		pool.getConnection(function(err, connection){
			if(req.user.id === userId) {
				var userSettings = [name, phoneNumber, phoneVisible, ggNumber, ggVisible, userId];
				connection.query('update user set name = ?, phone = ?, phoneVisible = ?, gg = ?, ggVisible = ? where id = ?', userSettings, function (err) {
					if (err) throw err;

					userService.getUser(userId, function(cb, user){
						res.status(200).send(user);
						connection.release();
					});

				});
			} else {
				res.status(500).send();
			}
		});
	}
});

app.post('/changeEmail', function(req, res) {
	if(req.body){
		var newEmail = req.body.newEmail,
			oldEmail = req.body.oldEmail,
			userId = req.body.userId;

		pool.getConnection(function(err, connection){
			if(req.user.email === oldEmail && req.user.id === userId) {
				connection.query('update user set email = ? where id = ?', [newEmail, userId], function (err) {
					if (err) throw err;

					req.user.email = newEmail;
					res.status(200).send(req.user);
					connection.release();

				});
			} else {
				res.status(500).send();
			}
		});
	}
});

app.post('/changeAvatar', function(req, res){
	if(req.body) {
		var userId = req.body.userId,
			avatar = req.body.avatar;
		pool.getConnection(function(err, connection) {
			if (req.user && req.user.id === userId) {
				connection.query('select * from user where id = ?', userId, function (err, rows) {
					if (err) {
						throw err;
					}

					if (rows[0].avatar !== null) {
						cloudinaryUtils.delete(userId, function (error, result) {
							if (error) {
								console.log(error);
								res.status(500).send(error);
							} else {
								console.log('SUUUUKCES usuniecia avatara', result);

								async.waterfall([
									function (cb) {


										cloudinaryUtils.upload(avatar, userId, function (error, result) {
											if (error) {
												cb(error);

											} else {
												console.log('SUUUUKCES dodania avatara', result);


												cb(null, result);
											}
										});


									},
									function (uploadedData, cb) {
										var avatarLink = uploadedData.secure_url;
										connection.query('update user set avatar = ? where id = ?', [avatarLink, userId], function (err) {
											if (err) cb(err);
											connection.query('select * from user where id = ?', userId, function(err, rows) {
												res.status(200).send(rows[0]);

											});

										});
									}
								], function (err, errorMessage) {
									console.log('zwykly err');

									if (!errorMessage) {
										connection.release();
										throw err;
									} else {
										console.log('errorMessage: ', errorMessage);
										res.status(500).send({message: errorMessage});
									}

								});

							}
						});
					}
				});
			} else {
				res.status(401).send();
			}
		});
	}
});