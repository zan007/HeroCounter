angular.module('timeUtils', [])
	.factory('timeUtils', ['$q', function ($q) {
		return {
			isToday: function(date){
				var diff = moment().diff(moment(date));
				return diff > 0 && diff < 86400000;
			},
			isYestarday: function(date){
				var diff = moment().diff(moment(date));
				return diff > 0 && diff >= 86400000 && diff < 2*86400000;
			}
		};
	}]);