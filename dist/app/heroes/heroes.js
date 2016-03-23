angular.module('heroes', ['dataSource', 'ngEnter', 'controls.hcCreatureTile', 'rzModule', 'filters.creaturesFilter']).

controller('heroesCtrl', ['$scope', '$rootScope', 'dataSource', '$http', 'creaturesFilter', '$cookies','$cookieStore', '$stateParams', '$timeout', 'socketFactory', 'notificationService',
	function($scope, $rootScope, dataSource, $http, creaturesFilter, $cookies, $cookieStore, $stateParams, $timeout, socketFactory, notificationService) {
		$scope.filteredCreatures = {};
		$scope.filter = creaturesFilter.get();

		$rootScope.$on('dataSource.ready', function() {
			$scope.creatures = $rootScope.model.creatures;
			$scope.filteredCreatures = creaturesFilter.filter($scope.creatures, $scope.filter);
		});
		
		if($rootScope.model.creatures && $rootScope.model.creatures.length > 0) {
			$scope.creatures = $rootScope.model.creatures;
			$scope.filteredCreatures = creaturesFilter.filter($scope.creatures, $scope.filter);
		}
		$scope.onlyWithKnownTime = $cookieStore.get('onlyWithKnownTime') ? $cookieStore.get('onlyWithKnownTime') : false;

		$timeout(function () {
	        $scope.$broadcast('rzSliderForceRender');
	    });

		$scope.creatureType = $cookieStore.get('creatureType') ? $cookieStore.get('creatureType') : {
			titan: true,
			hero: true
		};

		$scope.sendRequest = function() {
			dataSource.call({method: 'POST',
								url: '/registerEvent',
								data: { 
									token: '42031482ed73ae3391e0476329fdb6033fdffeba6f5c511eef74f61de36ab5e16cc63adaf946b98569ec133e130b34c4',
								 	nick: 'Nirun',
								 	creature: 'Renegat Baulus',
								 	group: ['Nirun', 'Szopen'],
								 	place: 'Mroczny przesmyk'
								}
							}, function(data) {
								//$rootScope.model.creatures = data.creatures;
								//$rootScope.$broadcast('dataSource.ready');
							});
		}

		$scope.lvlRangeSlider = {
			minValue: $cookieStore.get('lvlRange.minValue') ? $cookieStore.get('lvlRange.minValue'): 20,
			maxValue: $cookieStore.get('lvlRange.maxValue') ? $cookieStore.get('lvlRange.maxValue'): 320,
			options: {
				floor: 20,
				ceil: 320,
				step: 1,
				onChange: function() {
					/*$scope.filter.lvlRange = $scope.lvlRangeSlider;
					$scope.filteredCreatures = creaturesFilter.filter($scope.creatures, $scope.filter);*/
					$cookieStore.put('lvlRange.minValue', $scope.lvlRangeSlider.minValue); 
					$cookieStore.put('lvlRange.maxValue', $scope.lvlRangeSlider.maxValue);
				}
			}
		};
		
		$scope.timeSlider = {
			value: 24
		};

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

		$scope.$watch('creatures', function(creatures) {
			if(creatures && creatures.length > 0) {
				
			}
		});
	}
]);
