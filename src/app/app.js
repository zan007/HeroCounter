angular.module('heroCounter', [
	'ui.router',
	'ngAnimate',
	'ngMessages',
	'register',
	'login',
	'heroes',
	'profile',
	'titans',
	'activation',
	'settings',
	'eventHeroes',
	'userManager',
	'eventTitans',
	'dataSource',
	'ngTouch',
	'ngEnter',
	'constants',
	'timer',
	'userAuthService',
	'socketFactory',
	'notificationService',
	'utils.fastFilter',
	'ngCookies',
	'controls.hcPrettyTime',
	'controls.hcEventsTimeline',
	'controls.hcValidationPattern',
	'controls.hcEqual',
	'controls.hcNotEqual',
	'controls.hcUserHeroTile',
	'avatarService',
	'ngImgCrop'
])
.config(['$httpProvider', '$stateProvider', '$urlRouterProvider', function ($httpProvider, $stateProvider, $urlRouterProvider) {
   $httpProvider.interceptors.push(function($q, $location, $window) {
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
					$window.location.reload();

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
				newsVisible: false,
				destinationState: ''
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
			authRequire: true,
			params: {
				newsVisible: false
			}
		})
	    .state('userManager', {
			url: '/user-manager',
		   	templateUrl: '/user-manager',
		   	authRequire: true,
			params: {
			   newsVisible: false
			}
	    })
	    .state('activation', {
			url: '/activation',
			templateUrl: '/activation',
			authRequire: false,
			params: {
				newsVisible: false
			}
		})
	   .state('profile', {
		   url: '/profile?userId',
		   templateUrl: '/profile',
		   authRequire: true,
		   params: {
			   newsVisible: true
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
.run(function ($rootScope, userAuthService, $state, adminRestrictedStates) {
	$rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState) {
		
		if(userAuthService.getIsLogged() !== undefined) {
			if(userAuthService.getIsLogged() && (toState.name === 'register' || toState.name === 'login')) {
				event.preventDefault();
				$state.go(fromState);
			} else {
				var isAuthenticationRequired = toState.authRequire && !userAuthService.getIsLogged();
				
				if(isAuthenticationRequired){
					event.preventDefault();
					$state.go('login', {destinationState: toState.name});
				}
			}
		}

		var isPersonalDataReady = $rootScope.model && $rootScope.model.personalData;
		if(adminRestrictedStates[toState.name] && isPersonalDataReady && !$rootScope.model.personalData.isAdministrator) {

			$state.go(fromState.name || 'login');
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

.constant('adminRestrictedStates', {
	'userManager': true
})

.controller('AppCtrl', ['$rootScope', '$scope', 'dataSource', 'userAuthService', '$state', 'appStates', 'notificationService', '$stateParams', 'socketFactory', 'defaultAvatar',
	function($rootScope, $scope, dataSource, userAuthService, $state, appStates, notificationService, $stateParams, socketFactory, defaultAvatar) {

		userAuthService.init();
		$rootScope.showLogout = false;
		$scope.stateParams = $stateParams;
		$scope.defaultAvatarLink = defaultAvatar.link;
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
    		$scope.events = $rootScope.model.events;
    	});
    	

		$scope.btnClick = false;

		$scope.logout = function() {
			userAuthService.logout().then(function(data){
				$rootScope.states = appStates[userAuthService.getIsLogged()];
				$rootScope.model = {};
				socketFactory.disconnect();
				$state.go($rootScope.states[0].reference);
			});
		};

		var createSocketEventHandlers = function() {
			socketFactory.getSocket().then(function(socket) {

				socket.on('hello', function() {
	    			console.log('udalo sie hello');
	    		});

	    		socket.on('creaturesUpdated', function(data) {
		    		console.log('zupdatowana lista ', data);

		    		$rootScope.model.creatures = data.creatures;
		    		notificationService.showInfoNotification('Creatures list updated');
		    		$rootScope.$broadcast('dataSource.ready');
				});

				socket.on('eventsUpdated', function (data) {
					console.log('nowy event', data);
					$rootScope.model.events.unshift(data);
					notificationService.showInfoNotification('Events list updated');
					$rootScope.$broadcast('dataSource.ready');
				});
			});
		};
}]);

