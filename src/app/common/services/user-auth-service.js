angular.module('userAuthService', []).

factory('userAuthService', ['$rootScope', 'dataSource', '$http', '$q',  function($rootScope, dataSource, $http, $q) {
	var isLogged = false;
	dataSource.isLoggedIn().then(function(data){
		isLogged = data;
	});

	var loggIn = function(login, password) {
		var credentials = {
			login: login,
			password: password
		};
		var deferred = $q.defer();
		dataSource.logg(credentials).then(function(data) {
			console.log('service', data);
			this.isLogged = true;
			deferred.resolve();
		}, function(){
			deferred.reject();
		});

		return deferred.promise;
	};

	var logout = function() {
		var deferred = $q.defer();
		dataSource.logout().then(function(data) {
			console.log('logout service', data);
			this.isLogged = false;
			deferred.resolve();
		}, function() {
			deferred.reject();
		});

		return deferred.promise;
	};

	return {
		loggIn: loggIn,
		isLogged: isLogged,
		logout: logout
	}
}]);