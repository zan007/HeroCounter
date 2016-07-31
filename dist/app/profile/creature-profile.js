angular.module('creatureProfile', ['dataSource'])
.controller('creatureProfileCtrl', ['$scope', '$rootScope', 'dataSource', '$location', '$stateParams', '$state', function($scope, $rootScope, dataSource, $location, $stateParams, $state){

	$scope.pieChartData = [];

	var preparePieChartData = function(){
		var dateMap = $scope.creatureProfileModel.dateMap;
		var chartData = [
			{
				value: dateMap.morning,
				label: 'morning'
			},{
				value: dateMap.afternoon,
				label: 'afternoon'
			},{
				value: dateMap.evening,
				label: 'evening'
			},{
				value: dateMap.night,
				label: 'night'
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

	if($stateParams.creatureId) {
		dataSource.getCreatureProfile(parseInt($stateParams.creatureId)).then(function (data) {

			$scope.creatureProfileModel = data;
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