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
    socketIo = require('socket.io'),
    io,
    favicon = require('serve-favicon');

express.static.mime.define({
    'application/x-font-woff': ['woff'],
    'application/font-woff': ['woff']
});

process.env.NODE_ENV = 'production';

var app = express(),
    data = {
        creatures: ''
    },
    dataFile = path.normalize('data/data.json'),
    srcDir = path.join('..', 'dist'),
    imgDir = path.join('..','/server/img');

var connection = mysql.createConnection(databaseConfig.details);

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
var io;
var recalcCreatureRespTime = function(callback) {
    var today = moment().valueOf();
    var creatures = [];
    connection.query({
        sql: 'select * from creature',
        timeout: 1000
    }, function(err, rows, fields) {
        if (err) throw err;

        for (var i = 0; i < rows.length; i++) {
            currentCreature = rows[i];
            
            var msDate  = moment(rows[i].defeatedDate).valueOf();

            var minRespDate = currentCreature.type === 'titan'? moment(currentCreature.defeatedDate).add('days', currentCreature.minRespTime) : moment(currentCreature.defeatedDate).add('h', currentCreature.minRespTime); 
            var maxRespDate = currentCreature.type === 'titan'? moment(currentCreature.defeatedDate).add('days', currentCreature.maxRespTime) : moment(currentCreature.defeatedDate).add('h', currentCreature.maxRespTime);
            console.log('today', moment(minRespDate).format('DD/MM/YYYY HH:mm:ss'), moment(maxRespDate).format('DD/MM/YYYY HH:mm:ss'));
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
                console.log(moment(dateDifference).valueOf());
                currentCreature.timeToResp = dateDifference;
            }
            console.log(currentCreature, 'ddoodododod');
            creatures.push(currentCreature);
        }
        callback(null, creatures);
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
        res.send(model);
    });
});

app.post('/signup', passport.authenticate('local-signup', {
    failureRedirect : '/register', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages    
}), function(req, res){
    console.log('rejestracja poprawnie');
    res.sendfile(path.join(__dirname, srcDir, 'index.html'));
});

app.post('/defeat', function(req, res, next){
    var today = moment().format("YYYY-MM-DD HH:mm:ss");
    if(req.body && req.body.creatureName) {
        var creatureName = req.body.creatureName;

        connection.query('update creature set defeatedDate = ? where name = ?', [today, creatureName], function(err, rows2, fields){

        });
        connection.query('update creature set defeatCounter = defeatCounter + 1 where name = ?', [creatureName], function(err, rows2, fields){

        });
        recalcCreatureRespTime(function(empty, data) { 
            console.log('recalc defeat', data);
            var output = {
                creatures: data
            }
            io.emit('creaturesUpdated', output);
            res.send(output);
        });
    } else {
        res.status(404).send('not Found');
    }
});

app.post('/login', passport.authenticate('local-login', {
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }), function(req, res){
        console.log('logowanie poprawnie ');
        res.sendfile(path.join(__dirname, srcDir, 'index.html'));
    });
app.get('/creatures', function(req, res, next){
    creatures = [];
    connection.query({
        sql: 'select * from creature',
        timeout: 1000
    }, function(err, rows, fields) {
        if (err) throw err;

        for (var i = 0; i < rows.length; i++) {
            console.log(rows[i]);
            creatures.push(rows[i]);
        };

        //console.log(creatures);
        res.send(creatures);
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




var runServer = function(err) {
    if (err)
        throw err;

    //data = generatedData;
    var server = app.listen(process.env.PORT || 8000);
    io = require('socket.io').listen(server);

    io.on('connection', function(socket){
      console.log('a user connected');

       socket.on('disconnect', function(){
        console.log('user disconnected');
      });
    });
    console.log('Listening on port: ' + appConfig.listenPort);
}

runServer(null);
