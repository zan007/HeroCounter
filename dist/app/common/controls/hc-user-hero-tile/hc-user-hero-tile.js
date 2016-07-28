angular.module('controls.hcUserHeroTile', ['dataSource'])
.directive('hcUserHeroTile', ['$rootScope', 'dataSource', '$window', 'radialProgressService', function($rootScope, dataSource, $window, radialProgressService) {
	return {
		scope: {
			hero: '=hcUserHeroTile',
			stats: '='
		},
		replace: true,
		restriction: 'E',
		templateUrl: 'hc-user-hero-tile',
		link: function($scope, $elem) {

			var countPercent = function() {
				var percent = ($scope.battleCount * 100) / $scope.stats.summaryBattles;
				if(isNaN(percent)){
					return 0 + '%';
				} else {
					return percent + '%';
				}
			};

			var countAndRender = function(stats){
				var battles = stats.battles;
				for(var i = 0, len = battles.length; i < len; i++){
					var currentBattle = battles[i];
					if(currentBattle.heroId === $scope.hero.id){
						$scope.battleCount = currentBattle.battleCount;
					}
				}
				$scope.summaryPercent = countPercent();
				var d3 = $window.d3;
				if(d3.select($scope.radialChartElem[0]).select('.radial-svg')){
					d3.select($scope.radialChartElem[0]).select('.radial-svg').remove();
				}
				radialProgressService.radialProgress($scope.radialChartElem[0], $scope.stats.summaryBattles).diameter(150).data([{ type: "outer", value:  $scope.battleCount}]).render();
			};

			$scope.battleCount = 0;
			$scope.radialChartElem = $elem.find('g');
			$scope.$watch('stats', function(stats){
				countAndRender(stats);
			});

			angular.element($window).bind('resize', function() {
				countAndRender($scope.stats);
				$scope.$apply();
			});
			/*radialProgress($elem[0]).diameter(100)
			 .data([{ type: "outer", value: 32 }, { type: "inner", value: 84 }]).render();*/
		}
	};
}]);