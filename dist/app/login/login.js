angular.module('login', ['dataSource', 'ngEnter', 'userAuthService']).

controller('loginCtrl', ['$scope', '$rootScope', 'dataSource', '$http', 'userAuthService', 'appStates', '$state', 'notificationService',
    function($scope, $rootScope, dataSource, $http, userAuthService, appStates, $state, notificationService) {
    	$rootScope.showLogout = false;
		$scope.logg = function(login, password) {
			userAuthService.loggIn(login, password).then(function(data){
				$rootScope.states = appStates[true];
				userAuthService.setLogged(true);
				$state.go($rootScope.states[0].reference);
			});
		};

		$scope.showNotification = function() {
			notificationService.showSuccessNotification('wiadomosc');
		};
    }
]);
