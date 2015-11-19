angular.module('heroes', ['dataSource', 'ngEnter', 'controls.hcCreatureTile']).

controller('heroesCtrl', ['$scope', '$rootScope', 'dataSource', '$http',
    function($scope, $rootScope, dataSource, fileService, $http) {
    	$scope.creatures = $rootScope.model.creatures;
    	
    	$rootScope.$on('dataSource.ready', function() {
    		
    		$scope.creatures = $rootScope.model.creatures;
    	});
    }
]);
