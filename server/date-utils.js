var moment = require('moment');

module.exports = {
	timestampToSqlDatetime: function(timestamp) {
		return moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
	}
}