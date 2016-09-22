angular.module('profile', [])
.controller('profileCtrl', ['$scope', '$rootScope', 'dataSource', '$location', '$stateParams', 'defaultAvatar', '$state', 'locales', function($scope, $rootScope, dataSource, $location, $stateParams, defaultAvatar, $state, locales){
	console.log('profileCtrl');
	$scope.defaultAvatarLink = defaultAvatar.link;
	$scope.userProfileModel = {};
	$scope.lineChartData = [];
	$scope.pieChartData = [];

	$scope.goToUserProfile = function(id) {
		if(id){
			$state.go('profile', {userId: id});
		}
	};

	function compareBattleCount(a, b) {
		if (a.creatureBattleCount > b.creatureBattleCount)
			return -1;
		if (a.creatureBattleCount < b.creatureBattleCount)
			return 1;
		return 0;
	}

	var evaluatePieChartData = function(){
		var hasData = false;
		var guestDateMap = $scope.userProfileModel.guestHeroStats.dateMap;
		var mainDateMap = $scope.userProfileModel.mainHeroStats.dateMap;

		var summaryMorning = guestDateMap.morning + mainDateMap.morning;
		var summaryafternoon = guestDateMap.afternoon + mainDateMap.afternoon;
		var summaryEvening = guestDateMap.evening + mainDateMap.evening;
		var summaryNight = guestDateMap.night + mainDateMap.night;
		if(summaryMorning > 0 || summaryafternoon > 0 || summaryEvening > 0 || summaryNight > 0){
			hasData = true;
		}

		return hasData;
	};

	var preparePieChartData = function(){
		var guestDateMap = $scope.userProfileModel.guestHeroStats.dateMap,
			mainDateMap = $scope.userProfileModel.mainHeroStats.dateMap,
			chartData = [
				{
					value: guestDateMap.morning + mainDateMap.morning,
					label: locales.timeOfTheDay.morning
				},{
					value: guestDateMap.afternoon + mainDateMap.afternoon,
					label: locales.timeOfTheDay.afternoon
				},{
					value: guestDateMap.evening + mainDateMap.evening,
					label: locales.timeOfTheDay.evening
				},{
					value: guestDateMap.night + mainDateMap.night,
					label: locales.timeOfTheDay.night
				}
			];
		console.log(chartData, 'piechartdata');
		return chartData;
	};

	var concatCreatures = function(arrayWithDuplicates) {
		var concatedCreatures = [];
		var creaturesMap = {};
		for(var i = 0, len = arrayWithDuplicates.length; i < len; i++) {
			var currentElement = arrayWithDuplicates[i];
			if(creaturesMap[currentElement.creatureId]){
				creaturesMap[currentElement.creatureId].creatureBattleCount += currentElement.creatureBattleCount;
			} else {

				creaturesMap[currentElement.creatureId] = {
					creatureBattleCount: currentElement.creatureBattleCount
				};
			}
		}

		for(var item in creaturesMap){
			concatedCreatures.push({creatureId: parseInt(item), creatureBattleCount: creaturesMap[item].creatureBattleCount});
		}

		return concatedCreatures;
	};

	var prepareLineChartData = function(){
		var chartData = [];
		var sortedData = [];
		var topCount = 0;

		//chartData = $scope.userProfileModel.mainHeroStats.creatures.concat($scope.userProfileModel.guestHeroStats.creatures);
		chartData = concatCreatures($scope.userProfileModel.mainHeroStats.creatures.concat($scope.userProfileModel.guestHeroStats.creatures));
		for(var i = 0, len = chartData.length; i < len; i++){
			$rootScope.model.creatures.map(function(currentCreature){
				if(currentCreature.id === chartData[i].creatureId){
					chartData[i].name = currentCreature.name;
				}
			});
		}

		topCount = chartData.length >= 3 ? 3 : chartData.length;
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

		if(sortedData.length > topCount){
			var howManyElements =  sortedData.length - topCount;
			sortedData.splice(topCount-1, howManyElements);
		}

		return sortedData;
	};

	if($stateParams.userId) {
		dataSource.getUserProfile($stateParams.userId).then(function (data) {
			$scope.userProfileModel = data;
			$scope.lineChartData = prepareLineChartData();
			if(evaluatePieChartData()){
				$scope.pieChartData = preparePieChartData();
			}
		});
	}

}]);