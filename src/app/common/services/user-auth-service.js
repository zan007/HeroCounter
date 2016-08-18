angular.module('userAuthService', [])
.constant('AUTH_EVENTS', {
	sessionTimeout: 'auth-session-timeout',
	loginSuccess: 'auth-login-success',
  	loginFailed: 'auth-login-failed',
  	logoutSuccess: 'auth-logout-success',
  	notAuthenticated: 'auth-not-authenticated',
  	authenticated: 'auth-authenticated'
})
.factory('userAuthService', ['$rootScope', 'dataSource', '$http', '$q', 'AUTH_EVENTS',  function($rootScope, dataSource, $http, $q, AUTH_EVENTS) {
	var self = this;
	this.isLogged;

	var setLogged = function(value) {
		self.isLogged = value;
	};

	var getIsLogged = function() {
		return self.isLogged;
	};

	var getUserAuthData = function() {
		var deferred = $q.defer();
		dataSource.isLoggedIn().then(function(data){
			if(data && data.hasOwnProperty('password')){
				setLogged(true);
				console.log('serwis, ',data);
				$rootScope.$broadcast(AUTH_EVENTS.authenticated);
				deferred.resolve(data);
			} else {
				setLogged(false);
				$rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
				deferred.resolve();
			}	
		});

		return deferred.promise;
	};

	var init = function() {
		getUserAuthData().then(function(data) {
			$rootScope.$broadcast('app-ready');
		});
	};

	var loggIn = function(login, password) {
		var credentials = {
			login: login,
			password: password
		};
		var deferred = $q.defer();
		dataSource.logg(credentials).then(function(data) {
			if(data) {
				
				setLogged(true);
				/*this.isLogged = true;*/
				$rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
				deferred.resolve(data);
			} else {
				deferred.reject();
				$rootScope.$broadcast(AUTH_EVENTS.loginFailed);	
			}
		});

		return deferred.promise;
	};

	var logout = function() {
		var deferred = $q.defer();
		dataSource.logout().then(function(data) {
			console.log('logout service', data);
			setLogged(false);
			/*this.isLogged = false;*/
			$rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
			deferred.resolve();
		}, function() {
			deferred.reject();
		});

		return deferred.promise;
	};

	var register = function(registerData) {
		var deferred = $q.defer();
		dataSource.register(registerData).then(function(data) {
			deferred.resolve();
		}, function(){
			deferred.reject();
		});

		return deferred.promise;
	};

	return {
		loggIn: loggIn,
		getIsLogged: getIsLogged,
		logout: logout,
		register: register,
		init: init,
		getUserAuthData: getUserAuthData,
		authEvents: AUTH_EVENTS,
		setLogged: setLogged
	};
}]);