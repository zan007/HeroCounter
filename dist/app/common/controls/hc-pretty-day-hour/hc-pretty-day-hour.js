angular.module('controls.hcPrettyDayHour', [])

	.directive('hcPrettyDayHour', ['locales', 'timeUtils', function (locales, timeUtils) {
		return {
			scope: {
				hoursIn: '=hcPrettyDayHour',
				fullNames: '@'
			},
			replace: true,
			restriction: 'E',
			templateUrl: 'hc-pretty-day-hour',
			link: function($scope) {
				$scope.$watch('hoursIn', function(newDate, oldDate) {
					if ($scope.hoursIn) {
						$scope.days = Math.floor(($scope.hoursIn / 24).toFixed(0));
						$scope.hours = $scope.hoursIn % 24;
					}
				});
			}
		};
	}]);