angular.module('socketFactory', [])
.factory('socketFactory', ['$q', '$rootScope', '$timeout', 'userAuthService', '$location', function ($q, $rootScope, $timeout, userAuthService, $location) {
	/*var socket = $q.defer();

	$rootScope.$on('app-ready', function(data, next) {
		if(userAuthService.getIsLogged()) {
			 $timeout(function() {
	            var newSocket = new io();
	            //newSocket = io.connect('https://hero-counter.herokuapp.com');
	            newSocket = io.connect('http://localhost:8000');
	            
	            socket.resolve(newSocket);
	        });
		}
	});
	
    return socket.promise;*/
    var socket = '';
    var deferred = $q.defer();
   	function getSocket() {
   		//var deferred = $q.defer();
		if(socket) {
			deferred.resolve(socket);
		}

		return deferred.promise;
   	}

    return {
    	initializeSocket: function() {
    		socket = new io();
	        //newSocket = io.connect('https://hero-counter.herokuapp.com');
	        socket = io.connect($location.protocol() + '://' + $location.host() + ':' + $location.port());
	        deferred.resolve(socket);
    	},
    	disconnect: function() {
    		
    		//$timeout(socket.disconnect, 0, false);
    		socket.removeAllListeners();
    	},
    	getSocket: getSocket
    }
}])