angular.module('controls.hcTimePicker', ['dataSource'])

	.directive('hcTimePicker', ['dataSource', function (dataSource) {
		return {
			scope: {
				time: '=hcTimePicker'
			},
			replace: true,
			restriction: 'E',
			templateUrl: 'hc-time-picker',
			link: function($scope) {
				var date = moment($scope.time);

				$scope.$watch('time', function(newVal){
					date = moment(newVal);
					$scope.hour = date.hours();
					$scope.minutes = date.minutes();
				});

				$scope.incrementHour = function(){
					$scope.hour++;

					if($scope.hour >= 24) {
						$scope.hour = '00';
					}
				};

				$scope.decrementHour = function(){
					$scope.hour--;

					if($scope.hour <= 0) {
						$scope.hour = '23';
					}
				};

				$scope.incrementMinutes = function(){
					$scope.minutes++;

					if($scope.minutes >= 60) {
						$scope.minutes = '00';
					}
				};

				$scope.decrementMinutes = function(){
					$scope.minutes--;

					if($scope.minutes <= 0) {
						$scope.minutes = '59';
					}
				};

				$scope.$watch('hour', function(newHour, oldHour){
					if(newHour > 23 || newHour < 0){
						$scope.hour = oldHour;
					}
				});

				$scope.$watch('minutes', function(newMinutes, oldMinutes){
					if(newMinutes > 60 || newMinutes < 0){
						$scope.minutes = oldMinutes;
					}
				});
			}
		};
	}]);