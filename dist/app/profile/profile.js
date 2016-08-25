angular.module('profile', ['dataSource', 'controls.hcUserHeroTile'])
.controller('profileCtrl', ['$scope', '$rootScope', 'dataSource', '$location', '$stateParams', 'defaultAvatar', function($scope, $rootScope, dataSource, $location, $stateParams, defaultAvatar){
	console.log('profileCtrl');
	$scope.defaultAvatarLink = defaultAvatar.link;
	
	if($stateParams.userId) {
		dataSource.getUserProfile($stateParams.userId).then(function (data) {
			$scope.userProfileModel = data;
		});
	}
}]);