angular.module('creatureProfile', ['dataSource'])
.controller('creatureProfileCtrl', ['$scope', '$rootScope', 'dataSource', '$location', '$stateParams', '$state', function($scope, $rootScope, dataSource, $location, $stateParams, $state){

	if($stateParams.creatureId) {
		dataSource.getCreatureProfile(parseInt($stateParams.creatureId)).then(function (data) {

			$scope.creatureProfileModel = data;
			$scope.summaryBattles = data.battlesCount + data.reportsCount;
			/*$scope.userProfileModel = data;
			$scope.stripeChartData = prepareStripeChartData();
			if(evaluatePieChartData()){
				$scope.pieChartData = preparePieChartData();
			}*/
		});
	}


}]);