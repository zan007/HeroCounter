var path = require('path'),
	server = require('../server'),
	io = server.io,
	_ = require('lodash'),
	eventService = require('../event/event-service'),
	userService = require('../user/user-service'),
	dateUtils = require('../utils/date-utils'),
	pool = server.pool,
	async = require('async'),
	moment = require('moment'),
	app = server.app,
	io = server.io;



app.get('/getCreatureProfile', function(req, res) {
	console.log('poczatek pobierania profilu', req.params);
	if (req.param('creatureId') && req.isAuthenticated()) {

	}
});