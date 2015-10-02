angular.module('register', ['dataSource', 'ngEnter']).

controller('registerCtrl', ['$scope', '$rootScope', 'dataSource', '$http',
    function($scope, $rootScope, dataSource, fileService, $http) {
    	/*dataSource.init();
    	$rootScope.$on('dataSource.ready', function() {
    		
    		$scope.creatures = $rootScope.model.creatures;	
    	});*/
		var signup = function() {
			var credentials = {
				login: $scope.login,
				password: $scope.password
			}
			dataSource.signup(credentials);
		} 
    }
]);
