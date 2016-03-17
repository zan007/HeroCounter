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
    mysql = require('mysql'),
    authentication = require('./authentication'),
    passport = require('passport'),
    flash    = require('connect-flash'),
    moment = require('moment'),
    http = require('http').Server(express),
    io,
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
      database: databaseConfig.details.database
    });
    console.log('remote');
} else {
    pool = mysql.createPool({
      connectionLimit: 50,
      host: databaseConfig.homeDetails.host,
      user: databaseConfig.homeDetails.user,
      password: databaseConfig.homeDetails.password,
      database: databaseConfig.homeDetails.database
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
app.use(bodyParser.json());
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
    async.series({
        personalData: function(callback){
            var user = req.user;
            console.log(user);
            callback(null, user);
        },
        creatures: recalcCreatureRespTime
    },
    function(err, results){
        
        model.personalData = results.personalData;
        model.creatures = results.creatures;
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
app.get('/activate/:token', function(req, res) {
    console.log('poczatek aktywacji', req.params);
    if(req.params.token) {
        var token = req.params.token;
        var currentTimestamp = new Date().getTime();

        pool.query('select * from user where activationToken = ? and tokenExpirationDate > ?', [token, currentTimestamp], function(err, rows, fields) {
                if (err) throw err;

                if(rows.length == 1) {
                    console.log(rows[0]);
                    res.status(200);
                    pool.query('update user set activationToken = ? where activationToken = ?', [null, token], function(err, rows, fields) {
                            if (err) throw err;


                            res.sendfile(path.join(__dirname, srcDir, 'token-activated.html'));            
                         
                    })
                    
                } else {
                    res.status(404).send('not found');
                }
        })
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
            };

            //console.log(creatures);
            connection.release();
            res.send(creatures);
        });
    });
});

app.get('getEvents', function(req, res, next) {
    var events = [];
    if(req.params) {
        var fromTimestamp = req.params.from;
        var toTimestamp = req.params.to;
        pool.getConnection(function(err, connection) {
            connection.query({
                sql: 'select * from battle where '
            });
        });
    }
});

app.get('/registerEvent', function(req, res, next) {
    
    var token = req.body.token,
        nick = req.body.nick,
        creature = req.body.creature,
        group = req.body.group,
        place = req.body.place,
        timestamp = moment().format('YYYY-MM-DD HH:mm:ss');

    token = '42031482ed73ae3391e0476329fdb6033fdffeba6f5c511eef74f61de36ab5e16cc63adaf946b98569ec133e130b34c4';
                                    nick = 'Nirun';
                                    creature = 'Renegat Baulus';
                                    group = ['Nirun', 'Szopen'];
                                    place = 'Mroczny przesmyk';
    pool.getConnection(function(err, connection) {
        connection.query('select id from user where userToken = ?', token, function(err, rows) {
            if (err) throw err;

            if(rows.length === 1) {
                var userId = rows[0].id;
                var placeId = '';
                console.log('select user', timestamp);
                connection.query('select id from place where name = ?', place, function(err, rows) {
                    if(err) throw err;

                     console.log('select place');
                    if(rows.length === 1) {
                        placeId = rows[0].id;
                       
                    } else {
                        console.log('insert place');
                        connection.query('insert into place set ?', {name: place}, function(err, rows) {
                            if(err) throw err;

                            placeId = rows.insertId;
                        });
                    }
                });
                var creatureId = '';
                connection.query('select id from creature where name = ?', creature, function(err, rows) {
                    if (err) throw err;

                   
                    console.log('select creature');
                    if(rows.length === 1) {
                        creatureId = rows[0].id;
                        console.log('select creature v2', userId, nick);
                        connection.query('select id from hero where userId = ? and heroName = ?', [userId, nick], function(err, rows) {
                            if (err) throw err;

                            console.log(rows);
                            if(rows.length === 1) {
                                console.log('insert hero');
                                var heroId = rows[0].id;
                                if(creatureId && placeId) {
                                    console.log(timestamp);
                                    var battleFields = {
                                        creatureId: creatureId,
                                        battleDate: timestamp,
                                        placeId: placeId  
                                    }

                                    connection.query('insert into battle set ?', battleFields, function(err, rows) {
                                        if (err) throw err;
                                        console.log('insert battle');
                                        var battleId = rows.insertId;

                                        for(var i = 0, len = group.length; i < len; i++) {
                                            currentHeroName = group[i];
                                            console.log(currentHeroName);
                                            connection.query('select id from hero where heroName = ?', currentHeroName, function(err, rows) {
                                                if (err) throw err;

                                                console.log('for hero');
                                                var currentHeroId = '';
                                                if(rows.length === 1) {
                                                    currentHeroId = rows[0].id;
                                                } else {
                                                    connection.query('insert into hero set ?', {heroName: currentHeroName}, function(err, rows) {
                                                        if(err) throw err;
                                                        console.log('insert into hero new', rows);
                                                        currentHeroId = rows.insertId;
                                                    });
                                                }

                                                if(currentHeroId && battleId) {
                                                    var heroBattleFields = {
                                                        heroId: currentHeroId,
                                                        battleId: battleId
                                                    }
                                                    console.log('insert heroBattle', heroBattleFields);
                                                    connection.query('insert into heroBattle set ?', heroBattleFields, function(err, rows) {
                                                        if(err) throw err;

                                                        connection.release();
                                                        res.status(200).send();
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            } else {
                                connection.release();
                                res.status(500).send({message: 'unknown hero'});
                            }
                        });
                    } else {
                        connection.release();
                        res.status(500).send({message: 'unknown creature'});
                    }
                });
            } else {
                res.status(500).send({message: 'unknown token'});
            }
        });
    });
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




