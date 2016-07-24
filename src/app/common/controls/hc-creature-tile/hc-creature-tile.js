angular.module('controls.hcCreatureTile', ['dataSource'])

.directive('hcCreatureTile', ['dataSource', '$rootScope', function (dataSource, $rootScope) {
	return {
		scope: {
			creature: '=hcCreatureTile'
		},
		replace: true,
		restriction: 'E',
		templateUrl: 'hc-creature-tile',
		link: function ($scope) {
			$scope.showAdditionalActions = false;
			var reportDateTime = '';
			$scope.reportedDate = moment().format('YYYY-MM-DD');

			$scope.startCountdown = function (creature) {
				dataSource.defeatCreature(creature);
			};

			$scope.toggleAdditionalActions = function () {
				$scope.showAdditionalActions = !$scope.showAdditionalActions;

				$scope.reportedDate = moment().format('YYYY-MM-DD');
				$scope.reportedTime = moment().valueOf();
				console.log($scope.reportedTime, moment().valueOf());
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
					console.log('sukces raport ', data);
					$scope.showAdditionalActions = false;
					$scope.showLoadingIndicator = false;
				}, function (data) {
					console.log('error raport ', data);
				});
			};
		}
	};
}]);