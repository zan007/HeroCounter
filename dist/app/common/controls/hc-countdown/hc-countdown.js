angular.module('controls.hcCountdown', [])
	.directive('hcCountdown', ['$timeout', function($timeout) {
		return {
			scope: {
				timeToCountdown: '=hcCountdown'
			},
			templateUrl: 'hc-countdown',
			replace: true,
			link: function($scope, iElm, iAttrs, ctrl) {
				var startTimer = function() {
					var mytimeout = $timeout(onTimeout,1000);
				};

				var onTimeout = function(){
			        $scope.timeToCountdown = Math.floor($scope.timeToCountdown - 1000);
			        $scope.seconds = Math.floor(($scope.timeToCountdown / 1000) % 60);
		            $scope.minutes = Math.floor((($scope.timeToCountdown / (60000)) % 60));
		            $scope.hours = Math.floor((($scope.timeToCountdown / (3600000)) % 24));
		            $scope.days = Math.floor((($scope.timeToCountdown / (3600000)) / 24));
			        mytimeout = $timeout(onTimeout,1000);
			    }

			    if($scope.timeToCountdown){
			    	startTimer();
			    }
			}
		};
	}]);
