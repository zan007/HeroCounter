angular.module('login', ['dataSource', 'ngEnter', 'userAuthService', 'controls.hcValidationPattern']).

controller('loginCtrl', ['$scope', '$rootScope', 'dataSource', '$http', 'userAuthService', 'appStates', '$state', 'notificationService', '$stateParams',
    function($scope, $rootScope, dataSource, $http, userAuthService, appStates, $state, notificationService, $stateParams) {
    	$rootScope.showLogout = false;
		
		$scope.logg = function(login, password) {
			userAuthService.loggIn(login, password).then(function(data){
				$rootScope.states = appStates[true];
				userAuthService.setLogged(true);
				$state.go($stateParams.destinationState !== '' ? $stateParams.destinationState: $rootScope.states[0].reference, $stateParams.destinationParams);
			});
		};

		$scope.showNotification = function() {
			notificationService.showSuccessNotification('wiadomosc');
		};
    }
]);
