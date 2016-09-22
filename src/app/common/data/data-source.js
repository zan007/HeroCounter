angular.module('data.dataSource', ['data.authentication', 'data.context', 'data.creature', 'data.user', 'data.call'])

.factory('dataSource', ['authentication', 'context', 'creature', 'user',
	function(authentication, context, creature, user) {
		var dataSource = {};

		var use = function(service) {
			angular.extend(dataSource, service);
		};

		use(authentication);
		use(context);
		use(creature);
		use(user);

		return dataSource;
	}
]);
