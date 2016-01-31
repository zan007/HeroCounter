angular.module('settings', ['dataSource']).

controller('settingsCtrl', ['$scope', '$rootScope', 'dataSource',
    function($scope, $rootScope, dataSource) {
    	$scope.model = $rootScope.model;
    	
		
    }
]);
