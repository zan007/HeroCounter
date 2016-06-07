var server = require('../server'),
	pool = server.pool,
	async = require('async'),
	app = server.app;


app.post('/getUserProfile', function(req, res) {
	console.log('poczatek pobierania profilu', req.params);
	if(req.body && req.body.userId){
		var userId = req.body.userId;

		pool.query('select * from user where id = ?', [userId], function (err, rows) {
			if (err) {
				throw err;
			}

			if (rows.length === 1) {
				res.status(200).send(rows[0]);

			} else {
				res.status(404).send('not found');
			}
		});
	} else {
		res.status(404).send('not Found');
	}
});