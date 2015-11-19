angular.module('heroCounter', [
	'ui.router',
	'ngAnimate', 
	'register',
	'login',
	'heroes',
	'titans',
	'eventHeroes',
	'eventTitans',
	'dataSource',
	'ngTouch',
	'hideMenu',
	'ngEnter',
	'timer',
	'userAuthService'
])
.config(['$httpProvider', '$stateProvider', '$urlRouterProvider', function ($httpProvider, $stateProvider, $urlRouterProvider) {
   $httpProvider.interceptors.push(function($q, $location) {
		return {
			response: function(response) { 
				// do something on success 
				console.log('sukces');
				return response; 
			},
			responseError: function(response) {
				console.log('error');
				if(response.status === 401) {
					console.log('401');
					$location.url('/login');
				}

				return $q.reject(response);
			}
		};
	});

   $urlRouterProvider.otherwise(function(){
		return '/heroes';
   });
	
   $stateProvider
		.state('heroes', {
			url: '/heroes',
			templateUrl: '/heroes',
			authRequire: true
		})
		.state('eventHeroes', {
			url: '/event-heroes',
			templateUrl: '/event-heroes',
			authRequire: true
		})
		.state('titans', {
			url: '/titans',
			templateUrl: '/titans',
			authRequire: true
		})
		.state('eventTitans', {
			url: '/event-titans',
			templateUrl: '/event-titans',
			authRequire: true
		})
		.state('login', {
			url: '/login',
			templateUrl: '/',
			authRequire: false
		})
		.state('register', {
			url: '/register',
			templateUrl: '/register',
			authRequire: false
		});
}])
.run(function ($rootScope, userAuthService, $state) {
	$rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState) {
		
		if(userAuthService.getIsLogged() !== undefined) {
			if(userAuthService.getIsLogged() && (toState.name === 'register' || toState.name === 'login')) {
				event.preventDefault();
				$state.go(fromState);
			} else {
				var isAuthenticationRequired = toState.authRequire && !userAuthService.getIsLogged();
				
				if(isAuthenticationRequired){
					event.preventDefault();
					$state.go('login');
				}
			}
		}
	});

})
.constant('appStates', {
	true: [{
			reference: 'heroes',
			selected: true,
			name: 'HEROES'
		}, {
			reference: 'eventHeroes',
			selected: false,
			name: 'EVENT HEROES',
		}, {
			reference: 'titans',
			selected: false,
			name: 'TITANS'
		}, { 
			reference: 'eventTitans',
			selected: false,
			name: "EVENT TITANS"
		}],
	false: [{
			reference: 'login',
			selected: true,
			name: 'LOGIN'
		}, {
			reference: 'register',
			selected: false,
			name: 'REGISTER'
		}]

})
.controller('AppCtrl', ['$rootScope', '$scope', 'dataSource', 'userAuthService', '$state', 'appStates',
	function($rootScope, $scope, dataSource, userAuthService, $state, appStates) {

		userAuthService.init();
		$rootScope.$on('app-ready', function(data, next) {

			$rootScope.states = appStates[userAuthService.getIsLogged()];
			if(userAuthService.getIsLogged()) {
				dataSource.init();
			}
			$state.reload(true);
			//$state.go($scope.states[0].reference);
		});

		$rootScope.$on('auth-login-success', function(data, next) {
			dataSource.init();
		});

		$scope.btnClick = false;

		$scope.logout = function() {
			userAuthService.logout().then(function(data){
				$rootScope.states = appStates[userAuthService.getIsLogged()];
				$rootScope.model = {};
				$state.go($scope.states[0].reference);
			});
		}

		$rootScope.$on('dataSource.ready', function() {
    		$scope.personalData = $rootScope.model.personalData;
    	});
}]);

