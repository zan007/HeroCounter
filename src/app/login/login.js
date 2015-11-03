angular.module('login', ['dataSource', 'ngEnter', 'userAuthService']).

controller('loginCtrl', ['$scope', '$rootScope', 'dataSource', '$http', 'userAuthService',
    function($scope, $rootScope, dataSource, $http, userAuthService) {
    	/*dataSource.init();
    	$rootScope.$on('dataSource.ready', function() {
    		
    		$scope.creatures = $rootScope.model.creatures;	
    	});*/
		console.log(userAuthService);
		
    }
]);
