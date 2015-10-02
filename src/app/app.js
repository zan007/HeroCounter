angular.module('heroCounter', [
    'ngAnimate', 
    'ngRoute',
    'heroes',
    'titans',
    'eventHeroes',
    'eventTitans',
    'router',
    'dataSource',
    'ngTouch',
    'hideMenu',
    'ngEnter',
    'controls.hcCreatureTile',
    'timer'
])
.controller('AppCtrl', ['$scope', '$route', 'routes', 'dataSource',
    function($scope, $route, routes, dataSource) {
        $scope.routes = routes.getList();
        $scope.menuVisible = true;
        $scope.btnClick = false;
    }
]);

