angular.module('controls.hcEventsTimeline', ['dataSource'])

.directive('hcEventsTimeline', ['$state', 'dataSource', 'locales', '$rootScope', function($state, dataSource, locales, $rootScope) {
	return {
		scope: {
			events: '=hcEventsTimeline',
			middle: '=middle'
		},
		replace: true,
		restriction: 'E',
		templateUrl: 'hc-events-timeline',
		link: function($scope, $elem) {
			console.log(locales.daysOfWeek.monday);
			/*$rootScope.$on('dataSource.ready', function() {
				$scope.eventDate = new Date($scope.events.battleDate);
				console.log($scope.events);
			});*/

			$rootScope.$on('dataSource.ready', function(){
				$scope.showLoadingIndicator = false;
			});

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
					return eventDate.getDate() + '.' + (eventDate.getMonth() + 1);
				}
			};
			
			$scope.showDayLabel = function(event, index) {
				if(index === 0) {
					return true;
				} else {
					
						var currentEventDay = new Date(event.battleDate || event.reportDate).getDay();
						var prevEventDay = new Date($scope.events[index - 1].battleDate || $scope.events[index - 1].reportDate).getDay();

						return currentEventDay !== prevEventDay;
					
				}
			};

			$scope.goToUserProfile = function(id) {
				if(id){
					$state.go('profile', {userId: id});
				}
			};

			$scope.loadMoreEvents = function() {
				if($scope.events && $scope.events.length > 0) {
					$scope.showLoadingIndicator = true;
					var lastEventDate = $scope.events[$scope.events.length - 1].battleDate || $scope.events[$scope.events.length - 1].reportDate;
					dataSource.getEvents(moment(lastEventDate).subtract(1, 'days').valueOf(), moment(lastEventDate).subtract(1, 's').valueOf()).then(function(){
						$scope.showLoadingIndicator = false;
					});
				}
			};

			$elem.bind('scroll', function() {
				var element = $elem[0];
				if (element.scrollTop + element.offsetHeight >= element.scrollHeight) {
					$scope.loadMoreEvents();
				}
			});
		}
	};
}]);