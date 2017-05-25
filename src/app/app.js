$script.ready('angular', function() {
	angular.module('heroCounter', [
		'ui.router',
		'ngAnimate',
		'ngMessages',
		'register',
		'login',
		'creatures',
		'profile',
		'creatureProfile',
		'activation',
		'settings',
		'userManager',
		'data.dataSource',
		'ngTouch',
		'ngEnter',
		'constants',
		'timer',
		'timeUtils',
		'userAuthService',
		'radialProgressService',
		'socketFactory',
		'notificationService',
		'utils.fastFilter',
		'ngCookies',
		'hcLocales',
		'pikaday',
		'controls.hcPrettyTime',
		'controls.hcPrettyDayHour',
		'controls.hcEventsTimeline',
		'controls.hcValidationPattern',
		'controls.hcEqual',
		'controls.hcNotEqual',
		'controls.hcUserHeroTile',
		'controls.hcLineChart',
		'controls.hcCreatureBattleTile',
		'controls.hcPieChart',
		'controls.hcTimePicker',
		'controls.hcCountdown',
		'controls.hcTopChart',
		'avatarService',
		'ngImgCrop'
	])
	.config(['$httpProvider', '$stateProvider', '$urlRouterProvider', function ($httpProvider, $stateProvider, $urlRouterProvider) {
		$httpProvider.interceptors.push(function ($q, $location, $window, $rootScope) {
			return {
				response: function (response) {
					return response;
				},
				responseError: function (response) {
					if (response.status === 401) {
						$rootScope.logout();
					}

					return $q.reject(response);
				}
			};
		});

		$urlRouterProvider.otherwise(function () {
			return '/creatures';
		});

		$stateProvider
			.state('creatures', {
				url: '/creatures',
				templateUrl: '/creatures',
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
					destinationState: '',
					destinationParams: ''
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
				url: '/activation?token',
				templateUrl: '/activation',
				authRequire: false,
				params: {
					token: '',
					newsVisible: false
				}
			})
			.state('profile', {
				url: '/profile?userId',
				templateUrl: '/profile',
				authRequire: true,
				params: {
					newsVisible: true,
					userId: ''
				}
			})
			.state('creatureProfile', {
				url: '/creatureProfile?creatureId',
				templateUrl: '/creature-profile',
				authRequire: true,
				params: {
					newsVisible: true,
					creatureId: ''
				}
			});
	}])
	.config(['pikadayConfigProvider', function(pikaday) {
		pikaday.setConfig({
			format: 'YYYY-MM-DD'
		});
	}])
	.run(function ($rootScope, userAuthService, $state, adminRestrictedStates, locales) {
		$rootScope.appModules = locales.modules;

		$rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState) {

			if (userAuthService.getIsLogged() !== undefined) {
				if (userAuthService.getIsLogged() && (toState.name === 'register' || toState.name === 'login')) {
					event.preventDefault();
					$state.go(fromState);
				} else {
					var isAuthenticationRequired = toState.authRequire && !userAuthService.getIsLogged();

					if (isAuthenticationRequired) {
						event.preventDefault();
						$state.go('login', {destinationState: toState.name, destinationParams: toParams});
					}
				}
			}

			var isPersonalDataReady = $rootScope.model && $rootScope.model.personalData;
			if (adminRestrictedStates[toState.name] && isPersonalDataReady && !$rootScope.model.personalData.isAdministrator) {
				$state.go(fromState.name || 'login');
			}
		});

	})
	.constant('appStates', {
		true: [{
			reference: 'creatures',
			selected: true
		}, {
			reference: 'settings',
			selected: false
		}],
		false: [{
			reference: 'login',
			selected: true
		}, {
			reference: 'register',
			selected: false
		}]

	})

	.constant('adminRestrictedStates', {
		'userManager': true
	})

	.controller('AppCtrl', ['$rootScope', '$scope', 'dataSource', 'userAuthService', '$state', 'appStates', 'notificationService', '$stateParams', 'socketFactory', 'defaultAvatar', '$window', 'locales',
		function($rootScope, $scope, dataSource, userAuthService, $state, appStates, notificationService, $stateParams, socketFactory, defaultAvatar, $window, locales) {

			dataSource.getLanguage().then(function(data){
				$scope.activeLang = data;
			});

			userAuthService.initialize();
			$rootScope.showLogout = false;
			$scope.stateParams = $stateParams;
			$scope.defaultAvatarLink = defaultAvatar.link;
			$rootScope.locales = locales;

			var createSocketEventHandlers = function () {
				socketFactory.getSocket().then(function (socket) {

					socket.on('creaturesUpdated', function (data) {
						dataSource.updateCreatures(data.creatures);
						notificationService.showInfoNotification('Creatures list updated');
					});

					socket.on('eventsUpdated', function (data) {
						dataSource.addEvent(data);

						notificationService.showInfoNotification('Events list updated');

					});
				});
			};

			$rootScope.$on('app-ready', function (data, next) {

				$rootScope.states = appStates[userAuthService.getIsLogged()];
				if (userAuthService.getIsLogged()) {
					$rootScope.showLogout = true;
					dataSource.init();
					socketFactory.initializeSocket();
					createSocketEventHandlers();
				}
				$state.reload(true);

			});

			$rootScope.$on('auth-login-success', function (data, next) {
				dataSource.init();
				socketFactory.initializeSocket();
				createSocketEventHandlers();
				$rootScope.showLogout = true;
			});

			$rootScope.$on('dataSource.ready', function () {
				$scope.personalData = $rootScope.model.personalData;
				$scope.events = $rootScope.model.events;
			});


			$scope.btnClick = false;

			$rootScope.logout = function () {
				userAuthService.logout().then(function (data) {
					$rootScope.states = appStates[userAuthService.getIsLogged()];
					$rootScope.model = {};
					socketFactory.disconnect();
					$state.go($rootScope.states[0].reference);
				});
			};

			$scope.setLanguage = function(lang) {
				if(lang !== $scope.activeLang) {
					dataSource.setLanguage(lang).then(function () {
						$window.location.reload();
					});
				}

			};
		}]);
});
