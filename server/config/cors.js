module.exports = function() {
	return function(req, res, next) {
		res.header('Access-Control-Allow-Origin', 'http://game9.margonem.pl');
		res.header('Access-Control-Allow-Headers', 'X-Requested-With');
		next();
	};
};