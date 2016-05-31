angular.module('controls.hcPrettyTime', [])

.directive('hcPrettyTime', function () {
    return {
        scope: {
            date: '=hcPrettyTime',
			fullDate: '@'
        },
        replace: true,
        restriction: 'E',
        link: function($scope) {
            var convertDate = function() {
                var date = new Date($scope.date);
                $scope.hours = date.getHours();
                $scope.minutes = date.getMinutes();
				if($scope.fullDate) {
					$scope.day = date.getDay();
                    $scope.month = date.getMonth();
                    $scope.year = date.getFullYear();
				}
            }

            $scope.$watch('date', function(newDate, oldDate) {
                console.log('newDate', newDate, 'olddate', oldDate);
                convertDate();
            }, true);
        },
        templateUrl: 'hc-pretty-time'
    }    
});