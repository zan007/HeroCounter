angular.module('controls.hcTopChart', ['dataSource'])
	.directive('hcTopChart', ['$rootScope', 'dataSource', '$window', '$state', function($rootScope, dataSource, $window, $state) {
		return {
			scope: {
				topData: '=hcTopChart'
			},
			replace: true,
			restriction: 'E',
			templateUrl: 'hc-top-chart',
			link: function($scope, $elem) {

				$scope.goToUserProfile = function(id) {
					if(id){
						$state.go('profile', {userId: id});
					}
				};
			}
		};
	}]);