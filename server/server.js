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
    moment = require('moment');

express.static.mime.define({
    'application/x-font-woff': ['woff'],
    'application/font-woff': ['woff']
});

var app = express(),
    data = {
        creatures: ''
    },
    dataFile = path.normalize('data/data.json'),
    srcDir = path.join('..', 'dist'),
    imgDir = path.join('..','/server/img');

var connection = mysql.createConnection(databaseConfig.details);

require('./authentication')(passport);

app.use(cookieParser());
app.use(bodyParser.json());
app.use(session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

app.use('/app', express.static(path.join(__dirname, srcDir, 'app')));
app.use('/css', express.static(path.join(__dirname, srcDir, 'css')));
app.use('/img', express.static(path.join(__dirname, srcDir, 'img')));
app.use('/font', express.static(path.join(__dirname, srcDir, 'font')));
app.use('/vendor', express.static(path.join(__dirname, srcDir, 'vendor')));

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

            creatures.push(currentCreature);
        }
        callback(creatures);
    });
};

app.get('/init', function(req, res, next) {
    //creatures = [];
    //var output = {};
    recalcCreatureRespTime(function(data) {
        
        var output = {
            creatures: data
        }
        res.send(output);
    });
    /*var data = {creatures: recalcCreatureRespTime()};*/
    //console.log(output);
    /*connection.query({
        sql: 'select * from creature',
        timeout: 1000
    }, function(err, rows, fields) {
        if (err) throw err;

        var creatures = recalcCreatureRespTime();
        
        data.creatures = creatures;
        res.send(data);
    });*/
   // res.send(output);
});

/*app.get('/gen/:accCount/:trnCount/:monthsBack', function(req, res, next) {
    var trnCount = parseInt(req.params.trnCount, 0),
        accCount = parseInt(req.params.accCount, 0),
        monthsBack = parseInt(req.params.monthsBack, 0);

    gen.generateData(accCount, trnCount, monthsBack, function(err, generatedData) {
        if (err)
            return res.send(err);
        console.log('generate data');
        data = generatedData;
        res.send(data);
    });
});*/
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
        recalcCreatureRespTime(function(data) { 
            var output = {
                creatures: data
            }
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

        console.log(creatures);
        res.send(creatures);
    });
});

/*app.get('/update', function(req, res, next) {
    var fromDate = req.query.fromDate;
    var toDate = req.query.toDate;
    var moreTransactions = [];

    for (var i = 0; i < data.transactions.length; ++i) {
        if ((fromDate < data.transactions[i].date) && (toDate > data.transactions[i].date)) {
            moreTransactions.push(data.transactions[i]);
        }
    }

    data.moreTransactions = moreTransactions;
    data.transactionsFromTime = fromDate;
    res.send(data);
});*/

function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    console.log('islogged', req.isAuthenticated());
    if (req.isAuthenticated()){
        console.log('next');
        
        return next();
    }
    res.status(401);
    res.sendfile(path.join(__dirname, srcDir, 'index.html'));
    // if they aren't redirect them to the home page
   /*res.sendfile(path.join(__dirname, srcDir, 'login.html'));*/
   /*return next();*/
}

app.get('/', isLoggedIn, function(req, res, next) {
    console.log('poczatek');
    res.status(200);
    res.sendfile(path.join(__dirname, srcDir, 'index.html'));
   
});

app.get('/logout', function(req, res) {
    console.log('logout');
    req.logout();
    res.send(200);
     //res.sendfile(path.join(__dirname, srcDir, 'login.html'));
    //res.redirect('/');
});

app.get('/isLoggedIn', function(req, res) {
    console.log('isloggedIn request', req.isAuthenticated());
    res.send(req.isAuthenticated()? req.user : '0');
});

var runServer = function(err, generatedData) {
    if (err)
        throw err;

    data = generatedData;
    app.listen(appConfig.listenPort);
    console.log('Listening on port: ' + appConfig.listenPort);
}

if (!fs.existsSync(dataFile)) {
    gen.generateData(3, 100, 3, runServer);
} else {
    fs.readFile(dataFile, function(err, dataBuffer) {
        runServer(null, JSON.parse(dataBuffer));
    });
}
