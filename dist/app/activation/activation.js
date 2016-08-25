angular.module('activation', ['dataSource', 'ui.router']).

controller('activationCtrl', ['$scope', '$rootScope', '$location', 'dataSource',
	function($scope, $rootScope, $location, dataSource) {
		console.log('activationToken', $location.search().token);
		$rootScope.$on('app-ready', function(data, next) {
			console.log('activationCtrl');
			dataSource.activateUserAccount($location.search().token);
		});
	}
]);
