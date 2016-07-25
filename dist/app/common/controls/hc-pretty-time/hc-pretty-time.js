angular.module('controls.hcPrettyTime', [])

.directive('hcPrettyTime', function () {
    return {
        scope: {
            date: '=hcPrettyTime',
			fullDate: '@'
        },
        replace: true,
        restriction: 'E',
		templateUrl: 'hc-pretty-time',
        link: function($scope) {
            var convertDate = function() {
                $scope.hours = moment($scope.date).hour();
                $scope.minutes = moment($scope.date).minute();
				if($scope.fullDate) {
					$scope.day = moment($scope.date).date();
                    $scope.month = moment($scope.date).month() + 1;
                    $scope.year = moment($scope.date).year();
				}
            }

            $scope.$watch('date', function(newDate, oldDate) {
                console.log('newDate', newDate, 'olddate', oldDate);
                convertDate();
            }, true);
        }
    };
});