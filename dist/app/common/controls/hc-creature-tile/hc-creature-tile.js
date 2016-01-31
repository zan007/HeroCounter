angular.module('controls.hcCreatureTile', ['dataSource'])

.directive('hcCreatureTile', ['dataSource', function (dataSource) {
    return {
        scope: {
            creature: '=hcCreatureTile'
        },
        replace: true,
        restriction: 'E',
        link: function($scope) {
            $scope.startCountdown = function(creature) {
                dataSource.defeatCreature(creature);
            }
        },
        templateUrl: 'hc-creature-tile'
    }    
}]);