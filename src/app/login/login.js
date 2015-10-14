angular.module('login', ['dataSource', 'ngEnter']).

controller('loginCtrl', ['$scope', '$rootScope', 'dataSource', '$http',
    function($scope, $rootScope, dataSource, fileService, $http) {
    	/*dataSource.init();
    	$rootScope.$on('dataSource.ready', function() {
    		
    		$scope.creatures = $rootScope.model.creatures;	
    	});*/
		$scope.logg = function() {
			var data = dataSource.logg({
				login: $scope.login,
				password: $scope.password
			})
			
		}
    }
]);
