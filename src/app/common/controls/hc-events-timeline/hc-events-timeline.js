angular.module('controls.hcEventsTimeline', ['dataSource'])

.directive('hcEventsTimeline', ['$state', 'dataSource', 'locales', '$rootScope', 'timeUtils', 'locales', '$timeout', function($state, dataSource, locales, $rootScope, timeUtils, locales, $timeout) {
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
			$scope.showGoTopButton = false;
			$rootScope.$on('dataSource.ready', function(){
				$scope.showLoadingIndicator = false;
			});

			$scope.getDayName = function(date) {
				if(timeUtils.isToday(date)) {
					return locales.today;
				} else if(timeUtils.isYestarday(date)){
					return locales.yesterday;
				} else {
					return moment(date).format('DD MM');
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

			$scope.goToCreatureProfile = function(id){
				if(id){
					$state.go('creatureProfile', {creatureId: id});
				}
			};

			$scope.goToTop = function(){
				$elem.animate({
					scrollTop : 0
				}, 500);
			};

			$scope.loadMoreEvents = function(daysBack) {
				if($scope.events && $scope.events.length > 0) {
					$scope.showLoadingIndicator = true;
					var baseMoreEventsCounter = daysBack || 1;
					var lastEventDate = $scope.events[$scope.events.length - 1].battleDate || $scope.events[$scope.events.length - 1].reportDate;
					dataSource.getEvents(moment(lastEventDate).subtract(baseMoreEventsCounter, 'days').valueOf(), moment(lastEventDate).subtract(1, 's').valueOf()).then(function(data){
						if(data.length === 0){
							if(baseMoreEventsCounter < 4) {
								$scope.loadMoreEvents(baseMoreEventsCounter + 1);

								baseMoreEventsCounter++;
							}
						} else {
							baseMoreEventsCounter = 1;
						}
						$scope.showLoadingIndicator = false;
					});
				}
			};

			$elem.bind('scroll', function() {
				var element = $elem[0];

				if (element.scrollTop + element.offsetHeight >= element.scrollHeight) {
					$scope.loadMoreEvents();
				}
				$scope.showGoTopButton = $elem[0].scrollTop > 20;
				$scope.$apply();
			});
		}
	};
}]);