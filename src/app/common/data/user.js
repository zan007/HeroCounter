angular.module('data.user', [])

	.factory('user', ['$http', '$q', '$rootScope', '$location', 'notificationService', 'locales', 'call',
		function($http, $q, $rootScope, $location, notificationService, locales, call) {
			var user = {
				getUserProfile: function(userId) {
					return call({
						method: 'GET',
						url: '/getUserProfile',
						params: {
							userId: userId
						}
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
				}
			};

			return user;
		}]);