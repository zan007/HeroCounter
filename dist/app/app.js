angular.module('heroCounter', [
	'ui.router',
	'ngAnimate', 
	'register',
	'login',
	'heroes',
	'titans',
	'settings',
	'eventHeroes',
	'eventTitans',
	'dataSource',
	'ngTouch',
	'ngEnter',
	'timer',
	'userAuthService',
	'socketFactory',
	'notification-service',
	'utils.fastFilter',
	'ngCookies'
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
			authRequire: true,
			params: {
				newsVisible: true
			}
		})
		.state('eventHeroes', {
			url: '/event-heroes',
			templateUrl: '/event-heroes',
			authRequire: true,
			params: {
				newsVisible: true
			}
		})
		.state('titans', {
			url: '/titans',
			templateUrl: '/titans',
			authRequire: true,
			params: {
				newsVisible: true
			}
		})
		.state('eventTitans', {
			url: '/event-titans',
			templateUrl: '/event-titans',
			authRequire: true,
			params: {
				newsVisible: true
			}
		})
		.state('login', {
			url: '/login',
			templateUrl: '/',
			authRequire: false,
			params: {
				newsVisible: false
			}
		})
		.state('register', {
			url: '/register',
			templateUrl: '/register',
			authRequire: false,
			params: {
				newsVisible: false
			}
		})
		.state('settings', {
			url: '/settings',
			templateUrl: '/settings',
			authRequire: false,
			params: {
				newsVisible: false
			}
		})
		.state('basic', {
			url: '/basic',
			templateUrl: '/basic',
			authRequire: false,
			params: {
				newsVisible: false
			}
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
		}, /*{
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
			name: 'EVENT TITANS'
		},*/ {
			reference: 'settings',
			selected: false,
			name: 'SETTINGS'
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
.controller('AppCtrl', ['$rootScope', '$scope', 'dataSource', 'userAuthService', '$state', 'appStates', 'notificationService', '$stateParams', 'socketFactory',
	function($rootScope, $scope, dataSource, userAuthService, $state, appStates, notificationService, $stateParams, socketFactory) {

		userAuthService.init();
		$rootScope.showLogout = false;
		$scope.stateParams = $stateParams;

		$rootScope.$on('app-ready', function(data, next) {

			$rootScope.states = appStates[userAuthService.getIsLogged()];
			if(userAuthService.getIsLogged()) {
				$rootScope.showLogout = true;
				dataSource.init();
				socketFactory.initializeSocket();
				createSocketEventHandlers();
			}
			$state.reload(true);
			
		});

		$rootScope.$on('auth-login-success', function(data, next) {
			dataSource.init();
			socketFactory.initializeSocket();
			createSocketEventHandlers();
			$rootScope.showLogout = true;
		});

		$rootScope.$on('dataSource.ready', function() {
    		$scope.personalData = $rootScope.model.personalData;
    	});

		$scope.btnClick = false;

		$scope.logout = function() {
			userAuthService.logout().then(function(data){
				$rootScope.states = appStates[userAuthService.getIsLogged()];
				$rootScope.model = {};
				socketFactory.disconnect();
				$state.go($rootScope.states[0].reference);
			});
		}

		var createSocketEventHandlers = function() {
			socketFactory.getSocket().then(function(socket) {

				socket.on('hello', function() {
	    			console.log('udalo sie hello');
	    		})

	    		socket.on('creaturesUpdated', function(data) {
		    		console.log('zupdatowana lista ', data);

		    		$rootScope.model.creatures = data.creatures;
		    		notificationService.showInfoNotification('Creatures list updated');
		    		$rootScope.$broadcast('dataSource.ready');
				});
			});
		};
}]);

