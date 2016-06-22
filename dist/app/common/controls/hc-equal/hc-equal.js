angular.module('controls.hcEqual', [])
	.directive('hcEqual', function() {
		return {
			require: 'ngModel',
			scope: {
				equalTo: '=hcEqual'
			},
			link: function($scope, iElm, iAttrs, ctrl) {
				iAttrs.$observe('hcEqual', function(value) {
					ctrl.$setValidity('hcEqual', true);
					if (value) {
						ctrl.$validate();
					}
				});

				$scope.$watch('equalTo', function(newVal, oldVal){
					if(newVal !== oldVal){
						ctrl.$validate();
					}
				});
				
				ctrl.$validators.hcEqual = function(value) {

					var equalResult = true;
					var result = true;
					if(value) {
						result = value === $scope.equalTo;
					}

					ctrl.$setValidity('hcEqual', result);
					equalResult = equalResult && result;

					return equalResult;
				};
			}
		};
	});
