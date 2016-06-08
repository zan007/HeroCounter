angular.module('profile', ['dataSource'])
.controller('profileCtrl', ['$scope', '$rootScope', 'dataSource', '$location', '$stateParams', function($scope, $rootScope, dataSource, $location, $stateParams){
	console.log('profileCtrl');
	if($stateParams.userId) {
		dataSource.getUserProfile($stateParams.userId).then(function (data) {
			$scope.userProfileModel = data;
		});
	}
}]);