angular.module('titans', ['dataSource', 'ngEnter']).

controller('titansCtrl', ['$scope', '$rootScope', 'dataSource', '$http',
    function($scope, $rootScope, dataSource, $http) {
    	$scope.model = $rootScope.model;
    }
]);
