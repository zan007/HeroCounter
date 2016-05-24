var express = require('express'),
    session = require('express-session'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    fs = require('fs'),
    path = require('path'),
    appConfig = require('./config/app'),
    databaseConfig = require('./config/database'),
    mime = require('mime'),
    async = require('async'),
    gen = require('./gen'),
    dateUtils = require('./date-utils'),
    mysql = require('mysql'),
    authentication = require('./authentication'),
    passport = require('passport'),
    flash    = require('connect-flash'),
    moment = require('moment'),
    http = require('http').Server(express),
    _ = require('lodash'),
    bluebird = require('bluebird'),
    io,
	bcrypt = require('bcrypt-nodejs'),
	cloudinaryUtils = require('./cloudinary-utils'),
    favicon = require('serve-favicon');

express.static.mime.define({
    'application/x-font-woff': ['woff'],
    'application/font-woff': ['woff']
});

process.env.NODE_ENV = 'production';

var app = express(),
    server,
    data = {
        creatures: ''
    },
    dataFile = path.normalize('data/data.json'),
    srcDir = path.join('..', 'dist'),
    imgDir = path.join('..','/server/img'),
    pool;

if(process.argv[2] === 'remote') {
    pool = mysql.createPool({
        connectionLimit: 50,
        host: databaseConfig.details.host,
        user: databaseConfig.details.user,
        password: databaseConfig.details.password,
        database: databaseConfig.details.database,
        multipleStatements: true
    });
    console.log('remote');
} else {
    pool = mysql.createPool({
        connectionLimit: 50,
        host: databaseConfig.homeDetails.host,
        user: databaseConfig.homeDetails.user,
        password: databaseConfig.homeDetails.password,
        database: databaseConfig.homeDetails.database,
        multipleStatements: true
    });
}

require('./authentication')(passport);

app.use('/app', express.static(path.join(__dirname, srcDir, 'app')));
app.use('/css', express.static(path.join(__dirname, srcDir, 'css')));
app.use('/img', express.static(path.join(__dirname, srcDir, 'img')));
app.use('/font', express.static(path.join(__dirname, srcDir, 'font')));
app.use('/vendor', express.static(path.join(__dirname, srcDir, 'vendor')));
app.use(favicon(path.join(__dirname, srcDir, 'favicon.ico')));

app.use(cookieParser());
var jsonParser = bodyParser.json({limit: '50mb'});
var urlencodedParser =  bodyParser.urlencoded({limit: '50mb', extended: true, parameterLimit:50000});
app.use(jsonParser);
app.use(urlencodedParser);
app.use(session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

var socketUserCounter = 0;

var setEventHandlers = function() {
    io.sockets.on('connection', function(socket){
        socketUserCounter++;
        console.log('a user connected ', socketUserCounter);
              
        socket.on('disconnect', function(){
            socketUserCounter--;
            socket.disconnect(true);
            console.log('user disconnected ', socketUserCounter);
        });
    });    
}

var runServer = function(err) {
    if (err)
        throw err;

    //data = generatedData;
    server = app.listen(process.env.PORT || 8000);
    //io = require('socket.io').listen(server);
    io = require('socket.io').listen(server);
    setEventHandlers();
    
    console.log('Listening on port: ' + appConfig.listenPort);
}

runServer(null);


var recalcCreatureRespTime = function(callback) {
    var today = moment().valueOf();
    var creatures = [];
    pool.getConnection(function(err, connection) {
        connection.query({
            sql: 'select * from creature',
            timeout: 1000
        }, function(err, rows, fields) {
            if (err) throw err;

            for (var i = 0; i < rows.length; i++) {
                currentCreature = rows[i];
                
                var msDate  = moment(rows[i].defeatedDate).valueOf();

                var minRespDate = moment(currentCreature.defeatedDate).add('h', currentCreature.minRespTime); 
                var maxRespDate = moment(currentCreature.defeatedDate).add('h', currentCreature.maxRespTime);
                //console.log('today', moment(minRespDate).format('DD/MM/YYYY HH:mm:ss'), moment(maxRespDate).format('DD/MM/YYYY HH:mm:ss'));
                if(moment(maxRespDate).isBefore(today)) {
                    console.log('stare');
                    currentCreature.timeToResp = null;
                } else {
                   /* console.log(maxRespDate > today);
                    console.log('oooo ' + moment(maxRespDate).format('DD/MM/YYYY HH:mm:ss'));
                    console.log('today format ' + moment(today).format('DD/MM/YYYY HH:mm:ss'));
                    console.log('dzis', moment(today, 'DD/MM/YYYY HH:mm:ss').diff(moment(maxRespDate, 'DD/MM/YYYY HH:mm:ss')));*/
                    var today2 = moment();
                    var dateDifference = moment(maxRespDate).diff(moment(today));
                  //  console.log(moment(dateDifference).valueOf());
                    currentCreature.timeToResp = dateDifference;
                }
                //console.log(currentCreature, 'ddoodododod');
                creatures.push(currentCreature);
            }
            connection.release();
            callback(null, creatures);
        });
    });
};

app.get('/init', function(req, res, next) {
    var model = {};
    var currentTimestamp = new Date().getTime();
    var eventOffset = moment(currentTimestamp).add('d', 2).valueOf();
    console.log('eventOffset', eventOffset.valueOf());
    async.series({
        personalData: function(callback){
            var user = req.user;
            console.log(user);
            callback(null, user);
        },
        creatures: recalcCreatureRespTime,
        events: getEvents/*function(next) {
            console.log('getEvents');
            getEvents(currentTimestamp, eventOffset, function(data, data2){
                console.log('data ',data, 'data2', data2);
                next(null, data2);
            });*/
            //console.log(next);
            /*console.log('init, events ', events);
            return events;*/
            //next(null, events);
        //}
    },
    function(err, results){
        
        model.personalData = results.personalData;
        model.creatures = results.creatures;
        model.events = results.events;
        console.log('powinien byc emit');
        io.sockets.emit('hello', {hello: true});
        res.send(model);
    });
});

app.post('/signup', passport.authenticate('local-signup', {
    failureRedirect : '/register', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}), function(req, res){
    console.log('rejestracja poprawnie');
    req.logOut();
    res.sendfile(path.join(__dirname, srcDir, 'index.html'));
});

app.post('/defeat', function(req, res, next){
    var today = moment().format("YYYY-MM-DD HH:mm:ss");
    if(req.body && req.body.creatureName) {
        var creatureName = req.body.creatureName;

        pool.query('update creature set defeatedDate = ? where name = ?', [today, creatureName], function(err, rows2, fields){

        });
        pool.query('update creature set defeatCounter = defeatCounter + 1 where name = ?', [creatureName], function(err, rows2, fields){

        });
        recalcCreatureRespTime(function(empty, data) { 
            /*console.log('recalc defeat', data);*/
            var output = {
                creatures: data
            }
            console.log('recalc defeat');

            io.emit('creaturesUpdated', output);
            
            res.send(output);
        });
    } else {
        res.status(404).send('not Found');
    }
});
app.post('/activate', function(req, res) {
    console.log('poczatek aktywacji', req.params);
    if(req.body && req.body.token) {
        var token = req.body.token;
        var currentTimestamp = new Date().getTime();

        pool.query('select * from user where activationToken = ? and tokenExpirationDate > ?', [token, currentTimestamp], function(err, rows, fields) {
                if (err) throw err;

                if(rows.length == 1) {
                    console.log(rows[0]);
                    res.status(200);
                    pool.query('update user set activationToken = ? where activationToken = ?', [null, token], function(err, rows, fields) {
						if (err) throw err;


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

		pool.query('update user set waitForAccept = ? where id = ?', [0, userId], function(err, rows, fields) {
			if (err) throw err;

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

		pool.query('update user set waitForAccept = ? where id = ?', [null, userId], function(err, rows, fields) {
			if (err) throw err;

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
/*app.post('/login', passport.authenticate('local-login', {
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }), function(req, res){
        console.log('logowanie poprawnie ', res);
        res.sendfile(path.join(__dirname, srcDir, 'index.html'));
    });*/
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
            res.sendfile(path.join(__dirname, srcDir, 'index.html'));
        });
    })(req, res, next);
});
app.get('/creatures', function(req, res, next){
    creatures = [];
    pool.getConnection(function(err, connection) {
        connection.query({
            sql: 'select * from creature',
            timeout: 1000
        }, function(err, rows, fields) {
            if (err) throw err;

            for (var i = 0; i < rows.length; i++) {
                /*console.log(rows[i]);*/
                creatures.push(rows[i]);
            }

            //console.log(creatures);
            connection.release();
            res.send(creatures);
        });
    });
});

var getEvents = function(cb, fromTimestamp, toTimestamp) {
    var events = [];
    console.log('getEfents w srodku ',fromTimestamp, toTimestamp);
    pool.getConnection(function(err, connection) {
        if(!fromTimestamp && !toTimestamp){
            toTimestamp = new Date().getTime();
            fromTimestamp = moment(fromTimestamp).subtract('d', 10).valueOf();
        }
        fromDatetime = dateUtils.timestampToSqlDatetime(fromTimestamp);
        toDatetime = dateUtils.timestampToSqlDatetime(toTimestamp);
        console.log('from ',fromDatetime,' to: ',toDatetime);

        connection.query('select * from battle where battleDate >= ? and battleDate <= ?', [fromDatetime, toDatetime], function(err, rows) {
                if(err) throw err;

                console.log('query events');
                //for(var i = 0, len = rows.length; i < len; i++) {
                async.forEachLimit(rows, 1, function(currentBattle, battleCallback){
                    console.log('foreach ', currentBattle);
                    var place = '',
                        creature = '',
                        battleDate = currentBattle.battleDate,
                        group = [];
                        
                    async.waterfall([
                        function(wcb) {
                            connection.query('select * from place where id = ?', currentBattle.placeId, function(err, rows) {
                                if(err) wcb(err);

                                place = rows[0];
                                wcb();
                            });
                        },
                        function(wcb) {
                            connection.query('select * from creature where id = ?', currentBattle.creatureId, function(err, rows) {
                                if(err) wcb(err);

                                creature = rows[0];
                                wcb();
                            });
                        },
                        function(wcb) {
                            connection.query('select hero.* from hero left join heroBattle on heroBattle.heroId = hero.id and herobattle.id = ?', currentBattle.id, function(err, rows) {
                                if(err) wcb(err);

                                for(var j = 0, len = rows.length; j < len; j++){
                                    group.push(rows[j]);
                                }
                                wcb();
                            });
                        },
                        function(wcb) {
                            events.push({
                                id: currentBattle.id,
                                place: place,
                                creature: creature,
                                battleDate: battleDate,
                                group: group
                            });
                            
                           wcb(); 
                        }
                    ], function (err) {
                        console.log('przed battleCallback', events);
                        battleCallback();
                        if (err) throw err;
                    });
                    /*connection.query('select * from place where id = ?', currentBattle.placeId, function(err, rows) {
                        if(err) throw err;

                        place = rows[0];
                    });
                    connection.query('select * from creature where id = ?', currentBattle.creatureId, function(err, rows) {
                        if(err) throw err;

                        creature = rows[0];
                    });
                    connection.query('select hero.* from hero left join heroBattle on heroBattle.heroId = hero.id and herobattle.id = ?', currentBattle.id, function(err, rows) {
                        if(err) throw err;

                        for(var j = 0, len = rows.length; i < len; i++){
                            group.push(rows[i]);
                        }
                    });
                    events[i] = {
                        id: currentBattle.id,
                        place: place,
                        creature: creature,
                        battleDate: battleDate,
                        group: group
                    }*/
                   
                }, function(err, result) {
                    console.log('po battleCallback', events, result);
                    var sortedEvents = _.orderBy(events, ['battleDate'], ['desc']);

                    cb(null, sortedEvents);
                });
        });
    });
};

app.get('/getEvents', function(req, res, next) {
    if(req.body) {
        var fromTimestamp = req.body.from;
        var toTimestamp = req.body.to;
        var events = getEvents(fromTimestamp, toTimestamp);

        res.send(events);
    }
});

var insertIntoHeroBattle = function(connection, currentHeroName, battleId, userId, guest, cb) {
    connection.query('select id from hero where heroName = ?', currentHeroName, function(err, rows) {
        if (err) cb(err);

        console.log('for hero');
        var currentHeroId = '';
        if(rows.length === 1) {
            currentHeroId = rows[0].id;
            console.log('znalazlem currentheroid', currentHeroId);
			//update creature set defeatedDate = ? where id = ?
			if(userId !== null && guest === true){
				connection.query('update hero set guestUserId = ? where id =?', [userId, currentHeroId], function(err, rows){
					if(err) cb(err);
				});
			} else if(userId !== null && guest === false) {
				connection.query('update hero set mainUserId = ? where id =?', [userId, currentHeroId], function(err, rows){
					if(err) cb(err);
				});
			}

			var heroBattleFields = {
				heroId: currentHeroId,
				battleId: battleId
			};
			console.log('herobattle', heroBattleFields);
			connection.query('insert into heroBattle set ?', heroBattleFields, function (err, rows) {
			});
        } else {
			console.log('dupa', currentHeroName);
			connection.query('insert into hero set ?', {heroName: currentHeroName}, function (err, rows) {
				if (err) cb(err);

				console.log('insert into hero new', rows);
				currentHeroId = rows.insertId;
				console.log('currentHeroId', currentHeroId);
				var heroBattleFields = {
					heroId: currentHeroId,
					battleId: battleId
				};
				console.log('herobattle', heroBattleFields);
				connection.query('insert into heroBattle set ?', heroBattleFields, function (err, rows) {
				});

				if(userId !== null && guest === true){
					connection.query('update hero set guestUserId = ? where id =?', [userId, currentHeroId], function(err, rows){
						if(err) cb(err);
					});
				} else if(userId !== null && guest === false) {
					connection.query('update hero set mainUserId = ? where id =?', [userId, currentHeroId], function(err, rows){
						if(err) cb(err);
					});
				}
			});
		}
        
    });
};

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

var getUsersToAccept = function(successCallback, errorCallback) {
	pool.getConnection(function(err, connection){
		var userToAcceptModel = ['id', 'email', 'name'];
		async.waterfall([function(cb) {
			connection.query('select id, email, name from user where waitForAccept = ?', 1, function(err, rows){
				if (err) throw err;

				if(rows) {
					return cb(null, rows);
				}

			});

		},
		function(users, cb){
			var usersToAccept = [];
			for(var i = 0, len = users.length; i < len; i++) {
				(function() {
					var iCopy = i;
					console.log(iCopy);
					var user = users[iCopy];
					connection.query('select heroName from hero where mainUserId = ?', user.id, function(err, rows){
						if (err) throw err;

						if(rows) {
							usersToAccept.push({userId: user.id,
								email: user.email,
								name: user.name,
								heroes: rows
							});

							if(iCopy === users.length - 1) {
								successCallback(usersToAccept);
								//res.status(200).send(usersToAccept);
							}
						}});
				}());
			}

		},
		function (err, errorMessage) {
			errorCallback();
		}]);
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

app.post('/getUsersToAccept', function(req, res, next) {
	if(req.body && req.body.userId){
		checkAdministrator(req.body.userId, function(){
			getUsersToAccept(function (usersToAccept) {
				res.status(200).send(usersToAccept);
			}, function () {
				res.status(500).send();
			});
		}, function() {
			res.status(500).send();
		});
	}
});

app.post('/registerEvent', function(req, res, next) {
    if(req.body){
        var token = req.body.token,
        nick = req.body.nick,
        creature = req.body.creature,
		guest = req.body.guest,
        group = req.body.group,
        place = req.body.place,
        timestamp = moment().format('YYYY-MM-DD HH:mm:ss');

        pool.getConnection(function(err, connection) {
            connection.query('select id from user where userToken = ?', token, function(err, rows) {
                if (err) throw err;

                if(rows.length === 1) {
                    var userId = rows[0].id;
                    var placeId = '';
                    var creatureId = '';
                    var battleId = '';
                    var battleFields = '';

                    console.log('select user', timestamp);
                    connection.beginTransaction(function(err) {
                        if (err) {
                            return connection.rollback(function() {
                                throw err;
                            });
                        }

                        async.waterfall([
                            function(cb) {
                                connection.query('select id from place where name = ?', place, function(err, rows) {
                                    if (err) {
                                        cb(err);
                                    }

                                    if(rows.length === 1) {
                                        placeId = rows[0].id;
                                        cb();
                                    } else {
                                        connection.query('insert into place set ?', {name: place}, function(err, rows) {
                                            if(err) cb(err);

                                            placeId = rows.insertId;
                                            cb();
                                        });
                                    }
                                });
                            },
                            function(cb) {
                                connection.query('select id from creature where name = ?', creature, function(err, rows) {
                                    if (err) cb(err);

                                    if(rows.length === 1) {
                                        creatureId = rows[0].id;

                                        connection.query('update creature set defeatedDate = ? where id = ?; update creature set defeatCounter = defeatCounter + 1 where id = ?', [timestamp, creatureId, creatureId], function(err, rows) {
                                            if(err) cb(err);

                                            cb();
                                        });
                                    } else {
                                        cb({}, 'unknown creature');
                                    }
                                });
                            },
                            /*function(cb) {
								if(guest) {
									connection.query('select id from hero where guestUserId = ? and heroName = ?', [userId, nick], function (err, rows) {
										if (err) cb(err);

										if (rows.length === 1) {
											var heroId = rows[0].id;

											cb();
										} else {
											console.log('unknown hero');
											connection.release();
											cb({}, 'unknown hero');
										}
									});
								} else {
									connection.query('select id from hero where mainUserId = ? and heroName = ?', [userId, nick], function (err, rows) {
										if (err) cb(err);

										if (rows.length === 1) {
											var heroId = rows[0].id;

											cb();
										} else {
											console.log('unknown hero');
											connection.release();
											cb({}, 'unknown hero');
										}
									});
								}
                            },*/
                            function(cb) {
                                battleFields = {
                                    creatureId: creatureId,
                                    battleDate: timestamp,
                                    placeId: placeId  
                                }

                                connection.query('insert into battle set ?', battleFields, function(err, rows) {
                                    if (err) cb(err);

                                    console.log('insert battle');
                                    battleId = rows.insertId;
                                    cb();
                                });
                            },
                            function(cb) {
                                for(var i = 0, len = group.length; i < len; i++) {
                                    var currentHeroName = group[i];
                                    console.log(currentHeroName);
									if(currentHeroName === nick) {
										insertIntoHeroBattle(connection, currentHeroName, battleId, userId, guest, cb);
									} else {
										insertIntoHeroBattle(connection, currentHeroName, battleId, null, null, cb);
									}
                                }
                                connection.commit(function(err) {
                                    if (err) cb(err);

                                    console.log('success!');
                                    connection.release();
                                    recalcCreatureRespTime(function(empty, data) { 
                                        /*console.log('recalc defeat', data);*/
                                        var output = {
                                            creatures: data
                                        }
                                        console.log('recalc defeat');

                                        io.emit('creaturesUpdated', output);

										getEvents(function(cb, data){
											console.log('getEvents po dodaniu', data);
											io.emit('eventsUpdated', data[0]);
										}, timestamp, timestamp);

                                        res.status(200).send(output);
                                    });


                                });
                               
                            }
                        ], function (err, errorMessage) {
                            console.log('zwykly err');
                            return connection.rollback(function() {
                                console.log('rollback');
                                if(!errorMessage) {
                                    connection.release();
                                    throw err;
                                } else {
                                    console.log('errorMessage: ', errorMessage);
                                    res.status(500).send({message: errorMessage});
                                }
                            });
                        });
                    });
                } else {
                    res.status(500).send({message: 'unknown token'});
                }
            });
        });
    }
});

function isLoggedIn(req, res, next) {
    console.log('islogged', req.isAuthenticated());
    if (req.isAuthenticated()){
        console.log('next');
        
        return next();
    }
   /* res.status(401);*/
    res.sendfile(path.join(__dirname, srcDir, 'index.html'));
}

app.get('/', isLoggedIn, function(req, res, next) {
    console.log('poczatek');
    res.status(200);
    res.sendfile(path.join(__dirname, srcDir, 'index.html'));
});

app.get('/logout', function(req, res) {
    console.log('logout');
    req.logOut();
    req.session.destroy(function (err) {
        res.send(200);
    });
});
app.get('/isLoggedIn', function(req, res) {
    console.log('isloggedIn request', req.isAuthenticated(), req.user);
    res.send(req.isAuthenticated()? req.user : {});
});

app.post('/changeEmail', function(req, res, next) {
	if(req.body){
		var newEmail = req.body.newEmail,
			oldEmail = req.body.oldEmail,
			userId = req.body.userId;

		pool.getConnection(function(err, connection){
			if(req.user.email === oldEmail && req.user.id === userId) {
				connection.query('update user set email = ? where id = ?', [newEmail, userId], function (err, result) {
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

app.post('/changePassword', function(req, res, next) {
	if(req.body){
		var newPasswordPlain = req.body.newPassword,
			oldPassword = req.body.oldPassword,
			userId = req.body.userId;

		bcrypt.compare(oldPassword, req.user.password, function(err, result){
			if(result){
				var newPasswordHash = bcrypt.hashSync(newPasswordPlain, bcrypt.genSaltSync(8), null);

				pool.getConnection(function(err, connection){
					if(req.user.id === userId) {
						connection.query('update user set password = ? where id = ?', [newPasswordHash, userId], function (err, rows) {
							if (err) throw err;

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

app.post('/changeAvatar', function(req, res, next){
	if(req.body) {
		var userId = req.body.userId,
			avatar = req.body.avatar;
		pool.getConnection(function(err, connection) {
			if (req.user && req.user.id === userId) {
				connection.query('select * from user where id = ?', userId, function (err, rows) {
					if (err) cb(err);

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
										connection.query('update user set avatar = ? where id = ?', [avatarLink, userId], function (err, rows) {
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

app.post('/applySettings', function(req, res, next) {
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
				connection.query('update user set name = ?, phone = ?, phoneVisible = ?, gg = ?, ggVisible = ? where id = ?', userSettings, function (err, rows) {
					if (err) throw err;

					getUser(userId, function(cb, user){
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

