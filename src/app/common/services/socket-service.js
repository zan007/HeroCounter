angular.module('socketService', [])
.factory('socketService', function ($rootScope) {
	
	var socket = new io.Socket('localhost',{
		port: 8000
	});

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
			/*socket = new io.Socket('localhost',{
				port: 8000
			});*/
			//socket = io.connect('https://localhost:8000');
			socket = io.connect('https://hero-counter.herokuapp.com');
		//return io('http://localhost:8000');			
		//socket = io.connect();
			//return io('http://hero-counter.herokuapp.com:80');
			
		},
		disconnect: function() {
			socket.disconnect();
		}

	};
});