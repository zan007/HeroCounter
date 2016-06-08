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
				personalData: {},
				events: [],
				users: []
			};			
		};
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
				notificationService.showErrorNotification(reason.data.message, reason.data.persistence);
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
							   	$rootScope.model.users = data.users;
					
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
			},
			getUsers: function() {
				return call({
					method: 'POST',
					url: '/getUsers',
					data: {
						userToken: $rootScope.model.personalData.userToken
					}
				}, function (data) {
					$rootScope.model.users = data;
					$rootScope.$broadcast('dataSource.ready');
				});
			},
			activateUserAccount: function(token) {
				return call({ method: 'POST',
					url: '/activate',
					data: {
						token: token
					}
				}, function(data) {
					$rootScope.model.users = data;
					$rootScope.$broadcast('dataSource.ready');
				});
			},
			acceptUserActivation: function(user) {
				return call({ method: 'POST',
					url: '/acceptUserActivation',
					data: {
						userToken: $rootScope.model.personalData.userToken,
						userId: user.id
					}
				}, function(data) {
					$rootScope.model.users = data;
					$rootScope.$broadcast('dataSource.ready');
				});
			},
			setAdministrator: function(user) {
				return call({ method: 'POST',
					url: '/setAdministrator',
					data: {
						userToken: $rootScope.model.personalData.userToken,
						userId: user.id
					}
				}, function(data) {
					$rootScope.model.users = data;
					$rootScope.$broadcast('dataSource.ready');
				});
			},
			setCommonUser: function(user) {
				return call({ method: 'POST',
					url: '/setCommonUser',
					data: {
						userToken: $rootScope.model.personalData.userToken,
						userId: user.id
					}
				}, function(data) {
					$rootScope.model.users = data;
					$rootScope.$broadcast('dataSource.ready');
				});
			},
			rejectUserActivation: function(user) {
				return call({ method: 'POST',
					url: '/rejectUserActivation',
					data: {
						userToken: $rootScope.model.personalData.userToken,
						userId: user.id
					}
				}, function(data) {
					$rootScope.model.users = data;
					$rootScope.$broadcast('dataSource.ready');
				});
			},
			changeEmail: function(user, oldEmailAddress, newEmailAddress) {
				return call({ method: 'POST',
					url: '/changeEmail',
					data: {
						userId: user.id,
						oldEmail: oldEmailAddress,
						newEmail: newEmailAddress
					}
				}, function(data) {
					$rootScope.model.personalData = data;

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
			},
			changeAvatar: function(userId, avatar) {
				return call({ method: 'POST',
					url: '/changeAvatar',
					data: {
						userId: userId,
						avatar: avatar
					}
				}, function(data) {
					$rootScope.model.personalData = data;

					$rootScope.$broadcast('dataSource.ready');
				});
			},
			applyContactSettings: function(contactSettingsModel) {
				return call({
					method: 'POST',
					url: '/applySettings',
					data: {
						phoneNumber: contactSettingsModel.phone,
						phoneVisible: contactSettingsModel.phoneVisible,
						ggNumber: contactSettingsModel.gg,
						ggVisible: contactSettingsModel.ggVisible,
						name: contactSettingsModel.name,
						userId: contactSettingsModel.id
					}
				}, function (data) {
					$rootScope.model.personalData = data;

					$rootScope.$broadcast('dataSource.ready');
				});
			},
			getUserProfile: function(userId) {
				return call({
					method: 'GET',
					url: '/getUserProfile',
					params: {
						userId: userId
					}
				}, function(data){

				});
			}
		};
	}
]);
