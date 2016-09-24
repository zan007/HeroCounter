var express = require('express'),
	cors = require('./config/cors'),
    session = require('express-session'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    path = require('path'),
    appConfig = require('./config/app'),
    databaseConfig = require('./config/database'),
    mime = require('mime'),
    async = require('async'),
    mysql = require('mysql'),
    passport = require('passport'),
    flash    = require('connect-flash'),
    _ = require('lodash'),
    io,
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
        connectionLimit: 100,
        host: databaseConfig.details.host,
        user: databaseConfig.details.user,
        password: databaseConfig.details.password,
        database: databaseConfig.details.database,
        multipleStatements: true
    });
    console.log('remote');
} else {
    pool = mysql.createPool({
        connectionLimit: 100,
        host: databaseConfig.homeDetails.host,
        user: databaseConfig.homeDetails.user,
        password: databaseConfig.homeDetails.password,
        database: databaseConfig.homeDetails.database,
        multipleStatements: true
    });
}
pool.on('enqueue', function () {
	console.log('Waiting for available connection slot');
});
app.use(cors());
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
app.use(passport.session());
app.use(flash()); // use connect-flash for flash messages stored in session

var setEventHandlers = function() {
	io.sockets.on('connection', function(socket){
		socketUserCounter++;
		console.log('a user connected ', socketUserCounter);

		socket.on('disconnect', function(){
			socketUserCounter--;
			socket.disconnect(true);
			pool.getConnection(function(err, connection){
				connection.release();
			});
			console.log('user disconnected ', socketUserCounter);
		});
	});
};

var runServer = function(err) {
	if (err)
		throw err;

	server = app.listen(process.env.PORT || 8000);
	io = require('socket.io').listen(server);
	setEventHandlers();

	console.log('Listening on port: ' + appConfig.listenPort);
};

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
var creatureProfileService = require('./creature/creature-profile-service');
var settingsService = require('./settings/settings-service');
var authentication = require('./authentication/authentication');
require('./authentication/authentication')(passport);
var socketUserCounter = 0;
var random = require('./random/random');

app.get('/init', function(req, res) {
    var model = {};
    async.series({
        personalData: function(callback){
           	var user = req.user;

            callback(null, user);
        },
        creatures: creatureService.recalcCreatureRespTime,
        events: eventService.getEvents
    },
    function(err, results){
        
        model.personalData = results.personalData;
        model.creatures = results.creatures;
        model.events = results.events;

        res.send(model);
    });
});

app.get('/addon', function(req, res){
	res.status(200);

	res.sendfile(path.join(__dirname, srcDir, 'addon', 'hero-counter-addon.js'));
});

app.get('/', function(req, res, next) {
    res.status(200);
	var lang = req.session.lang ? req.session.lang : 'pl';

    res.sendfile(path.join(__dirname, srcDir, 'index.' + lang + '.html'));
});