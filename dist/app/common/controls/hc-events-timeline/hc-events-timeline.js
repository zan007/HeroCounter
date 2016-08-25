angular.module('controls.hcEventsTimeline', ['dataSource'])

.directive('hcEventsTimeline', ['$rootScope', 'dataSource', function($rootScope, dataSource) {
	return {
		scope: {
			events: '=hcEventsTimeline',
			middle: '=middle'
		},
		replace: true,
		restriction: 'E',
		link: function($scope) {
			/*$rootScope.$on('dataSource.ready', function() {
				$scope.eventDate = new Date($scope.events.battleDate);
				console.log($scope.events);
			});*/
			$scope.getDayName = function(date) {
				var currentDate = new Date();
				var eventDate = new Date(date);
				var currentYearMonth = (currentDate.getMonth() + 1) + " " +currentDate.getYear();
				var eventYearMonth = (eventDate.getMonth() + 1) + " " +eventDate.getYear();
				if(currentYearMonth === eventYearMonth && currentDate.getDate() === eventDate.getDate()) {
					return 'today';
				} else if (currentYearMonth === eventYearMonth && currentDate.getDate() - 1 === eventDate.getDate()) {
					return 'yesterday';
				} else {
					return eventDate.getDate() + "." + (eventDate.getMonth() + 1);
				}
			}
			
			$scope.showDayLabel = function(event, index) {
				if(index === 0) {
					return true;
				} else {
					
						var currentEventDay = new Date(event.battleDate).getDay();
						var prevEventDay = new Date($scope.events[index - 1].battleDate).getDay();

						return currentEventDay != prevEventDay;
					
				}
			}
		},
		templateUrl: 'hc-events-timeline'
	}
}]);