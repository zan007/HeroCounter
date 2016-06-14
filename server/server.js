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
    authentication = require('./authentication/authentication'),
    passport = require('passport'),
    flash    = require('connect-flash'),
    moment = require('moment'),
    http = require('http').Server(express),
    _ = require('lodash'),
    bluebird = require('bluebird'),
    io,
	bcrypt = require('bcrypt-nodejs'),
    favicon = require('serve-favicon');

express.static.mime.define({
	'application/vnd.ms-fontobject': ['eot'],
    'application/x-font-woff': ['woff'],
    'application/font-woff': ['woff']
});

process.env.NODE_ENV = 'production';

var app = express(),
    server,
    srcDir = path.join('..', 'dist'),
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
        connectionLimit: 14,
        host: databaseConfig.homeDetails.host,
        user: databaseConfig.homeDetails.user,
        password: databaseConfig.homeDetails.password,
        database: databaseConfig.homeDetails.database,
        multipleStatements: true
    });
}

require('./authentication/authentication')(passport);

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

var setEventHandlers = function() {
	io.sockets.on('connection', function(socket){
		socketUserCounter++;
		console.log('a user connected ', socketUserCounter);

		socket.on('disconnect', function(){
			socketUserCounter--;
			socket.disconnect(true);
			pool.getConnection(function(err, connection){
				connection.destroy();
			});
			console.log('user disconnected ', socketUserCounter);
		});
	});
};

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

module.exports = {
	srcDir: srcDir,
	pool: pool,
	app: app,
	dirName: __dirname,
	io: io
};
var authenticationService = require('./authentication/authentication-service');
var userService = require('./user/user-service');
var creatureService = require('./creature/creature-service');
var eventService = require('./event/event-service');
var userProfileService = require('./user/user-profile-service');
var settingsService = require('./settings/settings-service');

var socketUserCounter = 0;




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
        creatures: creatureService.recalcCreatureRespTime,
        events: eventService.getEvents
    },
    function(err, results){
        
        model.personalData = results.personalData;
        model.creatures = results.creatures;
        model.events = results.events;
		model.users = results.users;

        console.log('powinien byc emit');
        io.sockets.emit('hello', {hello: true});
        res.send(model);
    });
});

/*app.post('/login', passport.authenticate('local-login', {
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }), function(req, res){
        console.log('logowanie poprawnie ', res);
        res.sendfile(path.join(__dirname, srcDir, 'index.html'));
    });*/

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

app.get('/isLoggedIn', function(req, res) {
    console.log('isloggedIn request', req.isAuthenticated(), req.user);
    res.send(req.isAuthenticated()? req.user : {});
});


