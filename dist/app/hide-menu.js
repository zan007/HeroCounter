angular.module('hideMenu', [])

.directive('hideMenu', function() {
    return {
        scope: {
            opened: '=hideMenu'
        },
        link: function($scope, element) {
            element.bind('click', function() {
                if (event.pageX > 99) {
                    $scope.$apply(function() {
                        $scope.opened = false;
                    });
                }
            });
        }
    };
});
