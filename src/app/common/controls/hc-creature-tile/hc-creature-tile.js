angular.module('controls.hcCreatureTile', [])

.directive('hcCreatureTile', ['dataSource', '$rootScope', 'notificationService', '$timeout', '$state', function (dataSource, $rootScope, notificationService, $timeout, $state) {
	return {
		scope: {
			creature: '=hcCreatureTile'
		},
		replace: true,
		restriction: 'A',
		templateUrl: 'hc-creature-tile',
		link: function ($scope) {
			$scope.showAdditionalActions = false;
			var reportDateTime = '';
			$scope.reportedDate = moment().format('YYYY-MM-DD');

			$scope.toggleAdditionalActions = function () {
				$scope.showAdditionalActions = !$scope.showAdditionalActions;

				$scope.reportedDate = moment().format('YYYY-MM-DD');
				$scope.reportedTime = moment().valueOf();
			};

			$scope.reportDefeat = function (creature, time, date) {
				var momentDate = moment(date);
				var momentTime = moment(time);
				$scope.showLoadingIndicator = true;
				var formattedDate = moment().set({
					'year': momentDate.get('year'),
					'month': momentDate.get('month'),
					'day': momentDate.get('day'),
					'hour': momentTime.get('hour'),
					'minute': momentTime.get('minute'),
					'second': momentTime.get('second'),
					'millisecond': momentTime.get('millisecond')
				});

				dataSource.reportDefeat(creature, formattedDate.valueOf(), $rootScope.model.personalData.userToken).then(function (data) {
					$scope.showAdditionalActions = false;
					$scope.showLoadingIndicator = false;
				}, function (data) {
					$scope.showAdditionalActions = false;
					$scope.showLoadingIndicator = false;
				});
			};

			var countTimeToResp = function(creature) {
					var today = moment().valueOf();
					var maxRespDate = moment(creature.defeatedDate).add('h', creature.maxRespTime);

					if (moment(maxRespDate).isBefore(today)) {
						creature.timeToResp = null;
					} else {
						var dateDifference = moment(maxRespDate).diff(moment(today));
						creature.timeToResp = dateDifference;
						$scope.$broadcast('timer-start');
					}


					return creature;
			};

			$scope.goToCreatureProfile = function(id){
				if(id){
					$state.go('creatureProfile', {creatureId: id});
				}
			};

			$scope.creature = countTimeToResp($scope.creature);

			$scope.$watch('creature', function(newVal, oldVal){
				$scope.creature = newVal;
				$scope.creature = countTimeToResp($scope.creature);
			});
		}
	};
}]);