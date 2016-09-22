angular.module('activation', ['ui.router']).

controller('activationCtrl', ['$scope', '$rootScope', 'dataSource', '$stateParams',
	function($scope, $rootScope, dataSource, $stateParams) {
		console.log('activationToken', $stateParams.token);
		$rootScope.$on('app-ready', function() {
			console.log('activationCtrl');
			if($stateParams.token) {
				dataSource.activateUserAccount($stateParams.token);
			}
		});
	}
]);
