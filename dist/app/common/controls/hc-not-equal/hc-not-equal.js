angular.module('controls.hcNotEqual', [])
	.directive('hcNotEqual', function() {
		return {
			require: 'ngModel',
			scope: {
				notEqualTo: '=hcNotEqual'
			},
			link: function($scope, iElm, iAttrs, ctrl) {
				iAttrs.$observe('hcNotEqual', function(value) {
					ctrl.$setValidity('hcNotEqual', true);
					if (value) {
						ctrl.$validate();
					}
				});

				$scope.$watch('notEqualTo', function(newVal, oldVal){
					if(newVal !== oldVal){
						ctrl.$validate();
					}
				});

				ctrl.$validators.hcNotEqual = function(value) {

					var equalResult = true;
					var result = true;
					if(value) {
						result = value !== $scope.notEqualTo;
					}

					ctrl.$setValidity('hcNotEqual', result);
					equalResult = equalResult && result;

					return equalResult;
				};
			}
		};
	});
