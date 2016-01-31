angular.module('socketService', [])
.factory('socketService', ['$location', '$rootScope', function ($location, $rootScope) {
	
	/*var socket = new io.Socket('localhost',{
		port: 8000
	});*/
	var socket = new io();
	//var socket = io.connect();
	console.log('socket init', socket);
	console.log('socket init', io);
	return {
		on: function (eventName, callback) {
			socket.on(eventName, function () {  
				var args = arguments;
				console.log('socket on');
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
			socket = io.connect('https://hero-counter.herokuapp.com');
			//socket = io.connect('http://localhost:8000');
			//return io('http://localhost:8000');

		},
		disconnect: function() {
			socket.disconnect();
		},
		getSocket: function() {
			return socket;
		}

	};
}]);