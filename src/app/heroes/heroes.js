angular.module('heroes', ['dataSource', 'ngEnter', 'controls.hcCreatureTile', 'rzModule', 'filters.creaturesFilter']).

controller('heroesCtrl', ['$scope', '$rootScope', 'dataSource', '$http', 'creaturesFilter',
    function($scope, $rootScope, dataSource, $http, creaturesFilter) {
    	$scope.filteredCreatures = {};
    	$scope.filter = creaturesFilter.get();
		$scope.creatures = $rootScope.model.creatures;
		
    	$scope.creatureType = {
    		titan: true,
    		hero: true
    	}

    	$scope.lvlRangeSlider = {
	        minValue: 20,
	        maxValue: 320,
	        options: {
	            floor: 20,
	            ceil: 320,
	            step: 1,
	            onChange: function() {
	            	$scope.filter.lvlRange = $scope.lvlRangeSlider;
                	$scope.filteredCreatures = creaturesFilter.filter($scope.creatures, $scope.filter);
	            }
	        }
	    };

	    $scope.timeSlider = {
	    	value: 24
	    };
	   
	   	$rootScope.$on('dataSource.ready', function() {
    		
    		$scope.creatures = $rootScope.model.creatures;
    		$scope.filteredCreatures = $scope.creatures;
    	});

	    $scope.$watch('creatureType', function(creatureType) {
	    	$scope.filter.creatureType = creatureType;
	    	$scope.filteredCreatures = creaturesFilter.filter($scope.creatures, $scope.filter);
	    }, true);
	    
		$scope.$watch('queryInput', function(queryInput) {
            $scope.filter.queryInput =  queryInput;
            if ($scope.filter.queryInput != null || $scope.filter.queryInput != undefined) {
                $scope.filteredCreatures = creaturesFilter.filter($scope.creatures, $scope.filter);
            }
        });

		$scope.$watch('onlyWithKnownTime', function(onlyWithKnownTime) {
	    	$scope.filter.onlyWithKnownTime = onlyWithKnownTime;
	    	$scope.filteredCreatures = creaturesFilter.filter($scope.creatures, $scope.filter);
	    });
    }
]);
