angular.module('controls.hcCreatureTile', ['dataSource'])

.directive('hcCreatureTile', ['dataSource', function (dataSource) {
    return {
        scope: {
            creature: '=hcCreatureTile'
        },
        replace: true,
        restriction: 'E',
		templateUrl: 'hc-creature-tile',
        link: function($scope) {
			$scope.showAdditionalActions = false;

            $scope.startCountdown = function(creature) {
                dataSource.defeatCreature(creature);
            };

			$scope.toggleAdditionalActions = function(){
				$scope.showAdditionalActions = !$scope.showAdditionalActions;
			};
        }
    };
}]);