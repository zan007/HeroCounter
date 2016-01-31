angular.module('heroes', ['dataSource', 'ngEnter', 'controls.hcCreatureTile', 'rzModule', 'filters.creaturesFilter']).

controller('heroesCtrl', ['$scope', '$rootScope', 'dataSource', '$http', 'creaturesFilter', '$cookies','$cookieStore',
    function($scope, $rootScope, dataSource, $http, creaturesFilter, $cookies, $cookieStore) {
    	$scope.filteredCreatures = {};
    	$scope.filter = creaturesFilter.get();
		$scope.creatures = $rootScope.model.creatures;
		$scope.onlyWithKnownTime = $cookieStore.get('onlyWithKnownTime') ? $cookieStore.get('onlyWithKnownTime') : false;

    	$scope.creatureType = $cookieStore.get('creatureType') ? $cookieStore.get('creatureType') : {
    		titan: true,
    		hero: true
    	};

    	$scope.lvlRangeSlider = {
	        minValue: $cookieStore.get('lvlRange.minValue') ? $cookieStore.get('lvlRange.minValue'): 20,
	        maxValue: $cookieStore.get('lvlRange.maxValue') ? $cookieStore.get('lvlRange.maxValue'): 320,
	        options: {
	            floor: 20,
	            ceil: 320,
	            step: 1,
	            onChange: function() {
	            	$scope.filter.lvlRange = $scope.lvlRangeSlider;
                	$scope.filteredCreatures = creaturesFilter.filter($scope.creatures, $scope.filter);
                	$cookieStore.put('lvlRange.minValue', $scope.lvlRangeSlider.minValue); 
                	$cookieStore.put('lvlRange.maxValue', $scope.lvlRangeSlider.maxValue);
	            }
	        }
	    };

	    $scope.timeSlider = {
	    	value: 24
	    };
	   
	   	$rootScope.$on('dataSource.ready', function() {
    		$scope.creatures = $rootScope.model.creatures;

    		 $scope.$watch('creatureType', function(creatureType) {
		    	$cookieStore.put('creatureType', creatureType); 
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
		    	$cookieStore.put('onlyWithKnownTime', onlyWithKnownTime); 
		    });
			
			$scope.$watch('lvlRangeSlider', function(lvlRange) {
	           		$scope.filter.lvlRange = lvlRange;
                	$scope.filteredCreatures = creaturesFilter.filter($scope.creatures, $scope.filter);
                	$cookieStore.put('lvlRange.minValue', lvlRange.minValue); 
                	$cookieStore.put('lvlRange.maxValue', lvlRange.maxValue);
	        }, true);

    	});

	   
    }
]);
