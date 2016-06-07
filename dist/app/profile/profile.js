angular.module('profile', ['dataSource'])
.controller('profileCtrl', ['$scope', '$rootScope', 'dataSource', '$location', function($scope, $rootScope, dataSource, $location){
	$rootScope.$on('app-ready', function(data, next) {
		console.log('profileCtrl');
		if($location.search().userId) {
			dataSource.getUserProfile($location.search().userId).then(function (data) {
				$scope.userProfileModel = data;
			});
		}
	});
}]);