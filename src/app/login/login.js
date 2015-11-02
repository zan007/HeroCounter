angular.module('login', ['dataSource', 'ngEnter', 'userAuthService']).

controller('loginCtrl', ['$scope', '$rootScope', 'dataSource', '$http', 'userAuthService', 'routes',
    function($scope, $rootScope, dataSource, $http, userAuthService, routes) {
    	/*dataSource.init();
    	$rootScope.$on('dataSource.ready', function() {
    		
    		$scope.creatures = $rootScope.model.creatures;	
    	});*/
		console.log(userAuthService);
		
    }
]);
