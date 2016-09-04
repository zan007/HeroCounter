angular.module('data.authentication', [])

.factory('authentication', ['$http', '$q', '$rootScope', '$location', 'notificationService', 'locales', 'call',
	function($http, $q, $rootScope, $location, notificationService, locales, call) {
		var initModel = function() {
			$rootScope.model = {
				creatures: [],
				personalData: {},
				events: [],
				users: []
			};
		};

		initModel();

		var authentication = {
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
			},
			changePassword: function(user, oldPassword, newPassword) {
				return call({ method: 'POST',
					url: '/changePassword',
					data: {
						userId: user.id,
						oldPassword: oldPassword,
						newPassword: newPassword
					}
				}, function(data) {
					$rootScope.model.personalData = data;

					$rootScope.$broadcast('dataSource.ready');
				});
			}
		};

		return authentication;
	}]);