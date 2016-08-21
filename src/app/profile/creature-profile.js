angular.module('creatureProfile', ['dataSource'])
.controller('creatureProfileCtrl', ['$scope', '$rootScope', 'dataSource', '$location', '$stateParams', '$state', 'locales', function($scope, $rootScope, dataSource, $location, $stateParams, $state, locales){

	$scope.pieChartData = [];

	var preparePieChartData = function(){
		var dateMap = $scope.creatureProfileModel.dateMap;
		var chartData = [
			{
				value: dateMap.morning,
				label: locales.timeOfTheDay.morning
			},{
				value: dateMap.afternoon,
				label: locales.timeOfTheDay.afternoon
			},{
				value: dateMap.evening,
				label: locales.timeOfTheDay.evening
			},{
				value: dateMap.night,
				label: locales.timeOfTheDay.night
			}
		];

		console.log(chartData, 'piechartdata');
		return chartData;
	};

	var evaluatePieChartData = function(){
		var hasData = false;
		var dateMap = $scope.creatureProfileModel.dateMap;

		if(dateMap.morning > 0 || dateMap.afternoon > 0 || dateMap.evening > 0 || dateMap.night > 0){
			hasData = true;
		}

		return hasData;
	};

	var getCreatureById = function(id){
		var creatures = $scope.model.creatures;
		for(var i = 0, len = creatures.length; i < len; i++){
			if(creatures[i].id == id){
				return creatures[i];
			}
		}
	};

	if($stateParams.creatureId) {
		dataSource.getCreatureProfile(parseInt($stateParams.creatureId)).then(function (data) {

			$scope.creatureProfileModel = data;
			$scope.creatureProfileModel.creature = getCreatureById($stateParams.creatureId);
			$scope.summaryBattles = data.battlesCount + data.reportsCount;

			if(evaluatePieChartData()){
				$scope.pieChartData = preparePieChartData();
			}
			/*$scope.userProfileModel = data;
			 $scope.stripeChartData = prepareStripeChartData();
			 if(evaluatePieChartData()){
			 $scope.pieChartData = preparePieChartData();
			 }*/
		});
	}

}]);