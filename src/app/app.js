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
		var isAuthenticationRequired = toState.authRequire && !userAuthService.isLogged;
		
		if(isAuthenticationRequired){
	    	event.preventDefault();
	    	$state.go('login');
	    }
    });
})
.controller('AppCtrl', ['$scope', 'dataSource', 'userAuthService', '$state',
    function($scope, dataSource, userAuthService, $state) {
        var authenticatedStates = [{
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
            }];

        var guestStates = [{
            reference: 'login',
            selected: true,
            name: 'LOGIN'
        }, {
            reference: 'register',
            selected: false,
            name: 'REGISTER'
        }]
        if(userAuthService.isLogged) {
            $scope.states = authenticatedStates;
        } else {
            $scope.states = guestStates;
        }
        $state.go($scope.states[0].reference);
        
        $scope.menuVisible = true;
        $scope.btnClick = false;

        $scope.logg = function(login, password) {
            userAuthService.loggIn(login, password).then(function(data){
                $scope.states = authenticatedStates;
                userAuthService.isLogged = true;
                $state.go($scope.states[0].reference);
            });
        };
        
        $scope.logout = function() {
            dataSource.logout().then(function(data) {
                $scope.states = guestStates;
                userAuthService.isLogged = false;
                $state.go($scope.states[0].reference);
            });
        }

        
}]);

