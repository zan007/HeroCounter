angular.module('socketFactory', [])
.factory('socketFactory', ['$q', '$rootScope', '$timeout', 'userAuthService', '$location', function ($q, $rootScope, $timeout, userAuthService, $location) {

    var socket = '';
    var deferred = $q.defer();

    return {
    	initializeSocket: function() {
    		socket = new io();
	        socket = io.connect($location.protocol() + '://' + $location.host() + ':' + $location.port());
	        deferred.resolve(socket);
    	},
    	disconnect: function() {
    		socket.removeAllListeners();
    	},
    	getSocket: function() {
			if(socket) {
				deferred.resolve(socket);
			}
			return deferred.promise;
		}
    };
}]);