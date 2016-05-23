angular.module('settings', ['dataSource', 'ngFileUpload']).

controller('settingsCtrl', ['$scope', '$rootScope', 'dataSource', 'avatarService',
    function($scope, $rootScope, dataSource, avatarService) {
		if($rootScope.model.personalData.isAdministrator) {
			dataSource.refreshUsersToAccept();
		}
		$rootScope.$on('dataSource.ready', function() {
			$scope.model = $rootScope.model;
		});
		$scope.croppedImg = '';
    	/*w modelu uzytkownicy do zaakceptowania, jak nie ma praw to pusta lista,
    	wyswietlanie komunikatu ze nie ma uzytkownikow do zaakceptowania jak pusta lista i uzytkownik typu administrator*/

		$scope.uploadAvatar = function(){
			dataSource.changeAvatar($rootScope.model.personalData.id, $scope.croppedImg);
		};

		$scope.cancelUploadAvatar = function(){
			$scope.croppedImg = null;
			$scope.editAvatar = false;
			$scope.loadedImg = null;
		};
		
		$scope.readFileImg = function(files){
			$scope.loadedImg = null;
			$scope.success = null;

			if (files && files.length) {
			    avatarService.readImageFile(files[0]).then(function(img){
					$scope.loadedImg = img;
				});
			}
	    };

		$scope.changePassword = function(changePasswordForm){
			dataSource.changePassword($rootScope.model.personalData, changePasswordForm.oldPassword, changePasswordForm.newPassword);
		};

		$scope.changeEmail = function(changeEmailForm){
			dataSource.changeEmail($rootScope.model.personalData, changeEmailForm.newEmail);
		};

		$scope.acceptUser = function(user){
			dataSource.acceptUserActivation(user);
		};

		$scope.rejectUser = function(user){
			dataSource.rejectUserActivation(user);
		};


		
    }
]);
