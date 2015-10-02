angular.module('heroes', ['dataSource', 'ngEnter']).

controller('heroesCtrl', ['$scope', '$rootScope', 'dataSource', '$http',
    function($scope, $rootScope, dataSource, fileService, $http) {
    	dataSource.init();
    	$rootScope.$on('dataSource.ready', function() {
    		
    		$scope.creatures = $rootScope.model.creatures;	
    	});
    }
]);
