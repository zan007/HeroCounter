angular.module('register', ['dataSource', 'ngEnter']).

controller('registerCtrl', ['$scope', '$rootScope', 'dataSource', '$http', 'userAuthService', '$state', 'locales', 'notificationService',
    function($scope, $rootScope, dataSource, $http, userAuthService, $state, locales, notificationService) {
    	
    	$scope.register = function(registerData) {
			userAuthService.register(registerData).then(function(data){
				notificationService.showSuccessNotification(locales.waitingForConfirmation, true);
				$state.go('login');
			}).then(null, function(error) {
				notificationService.showErrorNotification(error.message, true);
				$scope.registerMessage = error.message;
			});
		}
		
    }
]);
