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
    'timer'
])
.config(['$httpProvider', function ($httpProvider) {
   $httpProvider.interceptors.push(function($q, $location) {
        return {
            'response': function(response) { 
                // do something on success 
                console.log('sukces');
                return response; 
            },
            'responseError': function(response) {
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
.controller('AppCtrl', ['$scope', '$route', 'routes', 'dataSource',
    function($scope, $route, routes, dataSource) {
        $scope.routes = routes.getList();
        $scope.menuVisible = true;
        $scope.btnClick = false;


        
}]);

