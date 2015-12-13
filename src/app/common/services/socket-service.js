angular.module('socketService', [])
.factory('socketService', function ($rootScope) {
	
	var socket = new io.Socket();
	return {
		on: function (eventName, callback) {
			socket.on(eventName, function () {  
				var args = arguments;
				$rootScope.$apply(function () {
					callback.apply(socket, args);
				});
			});
		},
		emit: function (eventName, data, callback) {
			socket.emit(eventName, data, function () {
				var args = arguments;
				$rootScope.$apply(function () {
					if (callback) {
						callback.apply(socket, args);
					}
				});
			})
		},
		initializeConnection: function () {
			socket = io.connect();
			//return io('http://hero-counter.herokuapp.com:80');
			//return io('http://localhost:8080');
		},
		disconnect: function() {
			socket.disconnect();
		}

	};
});