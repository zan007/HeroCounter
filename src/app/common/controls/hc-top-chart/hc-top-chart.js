angular.module('controls.hcTopChart', [])
	.directive('hcTopChart', ['$rootScope', '$window', '$state', function($rootScope, $window, $state) {
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