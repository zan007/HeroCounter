angular.module('dataSource', []).

factory('dataSource', ['$http', '$q', '$rootScope', '$location', 'notificationService',
	function($http, $q, $rootScope, $location, notificationService) {
	   
/*		var model = {
			creatures: [],
			personalData: {}
		};*/
		var model;

		var initModel = function() {
			$rootScope.model = {
				creatures: [],
				personalData: {}
			};			
		}
		initModel();

		$rootScope.opened = false;
	
		var call = function(httpData, responseFn) {
			$rootScope.$broadcast('dataSource.start');
			var promise = $http(httpData).then(function(response) {
				var result;
				if (responseFn) {
					result = responseFn(response.data, response.status, response.headers);
				}
				$rootScope.$broadcast('dataSource.stop');
				return result || response.data;
			}).then(null, function(reason) {
				console.log(reason);
				notificationService.showErrorNotification(reason.data.message);
				$rootScope.$broadcast('dataSource.error');
				return $q.reject(reason);
			});
			return promise;
		};

		/*$http.get('init').then(function(response) {
			var data = response.data;

			model.creatures = data.creatures;
		 	model.personalData = data.personalData;

			$rootScope.$broadcast('dataSource.ready');
		}).then(null, function() {
			$rootScope.$broadcast('dataSource.error');
		});*/

		return {
			call: call,
			defeatCreature: function(creature) {
				return call({ method: 'POST',
								 url: '/defeat',
								 data: { 
								 	creatureName: creature.name 
								 }
							}, function(data) {
								//$rootScope.model.creatures = data.creatures;
								//$rootScope.$broadcast('dataSource.ready');
							});
			},
			init: function(){
				return call({method: 'GET',
							url: '/init',
							data: {}
							}, function(data) {
								//var data = response.data;

								$rootScope.model.creatures = data.creatures;
							   	$rootScope.model.personalData = data.personalData;
							   	$rootScope.model.events = data.events;
							   	
								$rootScope.$broadcast('dataSource.ready');
							});
			},
			register: function(registerData) {
				return call({ method: 'POST',
								 url: '/signup',
								 data: { 
									login: registerData.login,
									password: registerData.password,
									email: registerData.email,
									name: registerData.name
								}
							}, function(data) {
								
							});
			},
			logg: function(credential){
				 return call({ method: 'POST',
								 url: '/login',
								 data: { 
									login: credential.login,
									password: credential.password
								}
							}, function(data) {
								//console.log(data);
								//$location.path('/heroes');
							});
			},
			isLoggedIn: function(){
				var deferred = $q.defer();
				$http.get('/isLoggedIn').success(function(user){ 
					if(user){
						deferred.resolve(user);
					} else {
						deferred.reject();
					}
					/*if (user !== '0') {
						deferred.resolve();
						return ;
					} else {
						deferred.reject(); 
						$location.url('/login'); 
						return false;
					}*/ 
				}); 

				return deferred.promise; 
			},
			logout: function() {
				return call({ method: 'GET',
								 url: '/logout',
								 data: { }
							}, function(data) {
								initModel();
								$rootScope.$broadcast('dataSource.ready');
							});
			}
		};
	}
]);
