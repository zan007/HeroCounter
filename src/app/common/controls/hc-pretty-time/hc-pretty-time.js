angular.module('controls.hcPrettyTime', [])

.directive('hcPrettyTime', ['locales', 'timeUtils', function (locales, timeUtils) {
    return {
        scope: {
            date: '=hcPrettyTime',
			fullDate: '@',
			dayDescription: '@'
        },
        replace: true,
        restriction: 'E',
		templateUrl: 'hc-pretty-time',
        link: function($scope) {
			$scope.months = locales.months;
            var convertDate = function() {
                $scope.hours = moment($scope.date).hour();
                $scope.minutes = moment($scope.date).minute();

				if($scope.dayDescription){

					if(timeUtils.isToday($scope.date)) {
						$scope.isNear = true;
						$scope.nearText = locales.today;
					} else if(timeUtils.isYestarday($scope.date)){
						$scope.isNear = true;
						$scope.nearText = locales.yesterday;
					}
				}

				if($scope.fullDate) {
					$scope.day = moment($scope.date).date();
                    $scope.month = moment($scope.date).month();
                    $scope.year = moment($scope.date).year();
				}
            }

            $scope.$watch('date', function(newDate, oldDate) {
                console.log('newDate', newDate, 'olddate', oldDate);
                convertDate();
            }, true);
        }
    };
}]);