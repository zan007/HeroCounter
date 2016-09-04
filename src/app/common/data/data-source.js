angular.module('data.dataSource', ['data.authentication', 'data.context', 'data.creature', 'data.user', 'data.call'])

.factory('dataSource', ['$http', '$q', '$rootScope', '$location', 'notificationService', 'locales', 'authentication', 'context', 'creature', 'user',
	function($http, $q, $rootScope, $location, notificationService, locales, authentication, context, creature, user) {

		var model;
		var dataSource = {};

		var use = function(service) {
			angular.extend(dataSource, service);
		};

		use(authentication);
		use(context);
		use(creature);
		use(user);

		$rootScope.opened = false;

		return dataSource;

	}
]);
