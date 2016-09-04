angular.module('controls.hcCreatureBattleTile', [])
	.directive('hcCreatureBattleTile', ['$rootScope', '$window', 'radialProgressService', function($rootScope, $window, radialProgressService) {
		return {
			scope: {
				type: '@',
				count: '=hcCreatureBattleTile',
				summaryCount: '='
			},
			replace: true,
			restriction: 'E',
			templateUrl: 'hc-creature-battle-tile',
			link: function($scope, $elem) {

				var countPercent = function() {
					var percent = Math.floor(($scope.count * 100) / $scope.summaryCount);
					if(isNaN(percent)){
						return 0 + '%';
					} else {
						return percent + '%';
					}
				};

				var countAndRender = function(){

					$scope.summaryPercent = countPercent();
					var d3 = $window.d3;
					if(d3.select($scope.radialChartElem[0]).select('.radial-svg')){
						d3.select($scope.radialChartElem[0]).select('.radial-svg').remove();
					}
					radialProgressService.radialProgress($scope.radialChartElem[0], $scope.summaryCount).diameter(150).data([{ type: "outer", value:  $scope.count}]).render();
				};


				$scope.radialChartElem = $elem.find('g');

				$scope.$watchGroup(['count', 'summaryCount'], function(){
					countAndRender();
				});

				angular.element($window).bind('resize', function() {
					countAndRender();
					$scope.$apply();
				});
			}
		};
	}]);