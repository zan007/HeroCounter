angular.module('register', ['dataSource', 'ngEnter']).

controller('registerCtrl', ['$scope', '$rootScope', 'dataSource', '$http',
    function($scope, $rootScope, dataSource, fileService, $http) {
    	
    	$scope.register = function(registerData) {
			userAuthService.register(registerData).then(function(data){
				$state.go('login');
			}).then(null, function() {
				$scope.registerMessage = 'REGISTER FAILED, YOU CAN NOW LOGIN';
			});
		}
		
    }
]);
