angular.module('loginHeroCounter', [
    'ngAnimate', 
    'dataSource',
    'ngTouch',
    'ngEnter',
    'ngRoute',
    'router',
    'login',
    'register'
])
.controller('LoginAppCtrl', ['$scope', '$route', 'routes', 'dataSource',
    function($scope, $route, routes, dataSource) {
        $scope.routes = [{title: 'LOGIN', path: '/login', icon: 'icon-circle', selected: false},
        {title: 'register', path: '/register', icon: 'icon-circle', selected: false}];
    }
]);

