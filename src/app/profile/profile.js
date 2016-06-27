angular.module('profile', ['dataSource'])
.controller('profileCtrl', ['$scope', '$rootScope', 'dataSource', '$location', '$stateParams', 'defaultAvatar', function($scope, $rootScope, dataSource, $location, $stateParams, defaultAvatar){
	console.log('profileCtrl');
	$scope.defaultAvatarLink = defaultAvatar.link;
	$scope.userProfileModel = {};

	function compareBattleCount(a, b) {
		if (a.creatureBattleCount > b.creatureBattleCount)
			return -1;
		if (a.creatureBattleCount < b.creatureBattleCount)
			return 1;
		return 0;
	}

	var prepareStripeChartData = function(){
		var chartData = [];
		var sortedData = [];
		var topCount = 0;
		if($scope.userProfileModel) {
			chartData = $scope.userProfileModel.mainHeroStats.creatures.concat($scope.userProfileModel.guestHeroStats.creatures);
			for(var i = 0, len = chartData.length; i < len; i++){
				$rootScope.model.creatures.map(function(currentCreature){
					if(currentCreature.id === chartData[i].creatureId){
						chartData[i].name = currentCreature.name;
					}
				});
			}

			topCount = chartData.length >= 5 ? 5 : chartData.length;
			console.log(topCount, 'asas');
			sortedData = chartData.sort(compareBattleCount);

			/*for(var j = 0, len = topCount; j < len; j++){

				Math.max.apply(null, chartData.map(function(o){
					dataToReturn.push(o);
					chartData = chartData.filter(function(obj) {
						return chartData.indexOf(obj) === -1;
					});
					return o.creatureBattleCount;
				}));
			}*/
		}
		console.log(sortedData);


		return sortedData.length > topCount ? sortedData.splice(topCount, chartData.length - topCount) : sortedData;
	};

	if($stateParams.userId) {
		dataSource.getUserProfile($stateParams.userId).then(function (data) {
			$scope.userProfileModel = data;
			$scope.stripeChartData = prepareStripeChartData();

		});
	}
}]);