angular.module('heroCounter', [
    'ngAnimate', 
    'ngRoute',
    'register',
    'login',
    'heroes',
    'titans',
    'eventHeroes',
    'eventTitans',
    'router',
    'dataSource',
    'ngTouch',
    'hideMenu',
    'ngEnter',
    'timer',
    'userAuthService'
])
.config(['$httpProvider', function ($httpProvider) {
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
}])
.controller('AppCtrl', ['$scope', '$route', 'routes', 'dataSource', 'userAuthService', '$location',
    function($scope, $route, routes, dataSource, userAuthService, $location) {
        dataSource.isLoggedIn().then(function() {
            $scope.routes = routes.getAfterLoginList();
            $location.path('/heroes');
        }, function() {
            $scope.routes = routes.getLoginList();
        });
        
        $scope.menuVisible = true;
        $scope.btnClick = false;

        $scope.logg = function(login, password) {
            userAuthService.loggIn(login, password).then(function(data){
                $scope.routes = routes.getAfterLoginList();    
            });
        };
        
        $scope.logout = function() {
            dataSource.logout().then(function(data) {
                $scope.routes = routes.getLoginList();
            });
        }

        
}]);

