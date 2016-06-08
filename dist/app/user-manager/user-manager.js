angular.module('userManager', ['dataSource', 'ngEnter']).

controller('userManagerCtrl', ['$scope', '$rootScope', 'dataSource', 'notificationService', 'defaultAvatar',
	function($scope, $rootScope, dataSource, notificationService, defaultAvatar) {

		$scope.defaultAvatarLink = defaultAvatar.link;
		$scope.filterConfig = {
			field: 'name',
			reverse: false
		};

		$scope.reverse =

		$rootScope.$on('dataSource.ready', function() {
			$scope.users = $rootScope.model.users;
			if($scope.users && $scope.users.length > 0){
				$scope.activeUserId = $scope.users[0].id;
			}
		});

		if($rootScope.model.personalData && $rootScope.model.personalData.isAdministrator) {
			dataSource.getUsers();
		}


		$scope.setFilter = function(field){
			$scope.filterConfig.field = field;
			if(field === $scope.filterConfig.field){
				$scope.filterConfig.reverse =! $scope.filterConfig.reverse;
			}
		};

		$scope.openDetails = function(user) {
			if(user.waitForAccept !== null) {
				$scope.activeUserId = user.id;
			}
		};

		$scope.acceptUser = function(user){
			var acceptUserPromise = dataSource.acceptUserActivation(user);
			acceptUserPromise.then(function(){
				notificationService.showSuccessNotification('user ' + user.name + ' successfully accepted');
			});
		};

		$scope.rejectUser = function(user){
			var rejectUserPromise = dataSource.rejectUserActivation(user);

			rejectUserPromise.then(function(){
				notificationService.showSuccessNotification('user ' + user.name + ' successfully rejected');
			});

		};

		$scope.setAdministrator= function(user){
			var setAdministratorPromise =  dataSource.setAdministrator(user);

			setAdministratorPromise.then(function(){
				notificationService.showSuccessNotification('user ' + user.name + ' was successfully grant to administrator');
			});
		};

		$scope.setCommonUser= function(user){
			var setCommonUserPromise = dataSource.setCommonUser(user);
			setCommonUserPromise.then(function(){
				notificationService.showSuccessNotification('user ' + user.name + ' was successfully grant to standard user');
			});
		};
	}
]);
