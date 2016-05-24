angular.module('settings', ['dataSource', 'ngFileUpload']).

controller('settingsCtrl', ['$scope', '$rootScope', 'dataSource', 'avatarService', 'notificationService',
    function($scope, $rootScope, dataSource, avatarService, notificationService) {
		if($rootScope.model.personalData.isAdministrator) {
			dataSource.refreshUsersToAccept();
		}
		$rootScope.$on('dataSource.ready', function() {
			$scope.model = $rootScope.model;
		});
		$scope.croppedImg = '';
    	/*w modelu uzytkownicy do zaakceptowania, jak nie ma praw to pusta lista,
    	wyswietlanie komunikatu ze nie ma uzytkownikow do zaakceptowania jak pusta lista i uzytkownik typu administrator*/

		var createSettingsCheckpoint = function(data){
			var savedSettings = {
				gg: data.gg,
				ggVisible: data.ggVisible,
				phone: data.phone,
				phoneVisible: data.phoneVisible,
				name: data.name
			};

			return savedSettings;
		};

		var settingsCheckpoint = {};

		$scope.uploadAvatar = function(){
			dataSource.changeAvatar($rootScope.model.personalData.id, $scope.croppedImg);
		};

		$scope.cancelUploadAvatar = function(){
			$scope.croppedImg = null;
			$scope.editAvatar = false;
			$scope.loadedImg = null;
		};

		$scope.changeContactSettings = function(){
			$scope.editContactSettings = true;
			settingsCheckpoint = createSettingsCheckpoint($scope.model.personalData);
		};

		var restoreSettingsCheckpoint = function(){
			var personalData = $scope.model.personalData;
			personalData.gg = settingsCheckpoint.gg;
			personalData.ggVisible = settingsCheckpoint.ggVisible;
			personalData.phonw = settingsCheckpoint.phone;
			personalData.phoneVisible = settingsCheckpoint.phoneVisible;
			personalData.name = settingsCheckpoint.name;
		};

		$scope.applyContactSettings = function(){

			var contactSettingsPromise = dataSource.applyContactSettings($scope.model.personalData);
			contactSettingsPromise.then(function(data){
				$scope.editContactSettings = false;
				settingsCheckpoint = createSettingsCheckpoint(data);
				notificationService.showSuccessNotification('Contact settings succesfully changed');
			});
		};

		$scope.cancelContactSettings = function(){
			$scope.editContactSettings = false;
			restoreSettingsCheckpoint();
		};


		$scope.cancelChangeEmail = function(){
			$scope.showChangeEmailForm = false;
		};

		$scope.changeEmail = function(changeEmailForm){
			var changeEmailPromise = dataSource.changeEmail($rootScope.model.personalData, changeEmailForm.oldEmail, changeEmailForm.newEmail);
			changeEmailPromise.then(function(data){
				$scope.showChangeEmailForm = false;
				notificationService.showSuccessNotification('Successfully change your email address to '+ data.email);
			});
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
			var changePasswordPromise = dataSource.changePassword($rootScope.model.personalData, changePasswordForm.oldPassword, changePasswordForm.newPassword);

			changePasswordPromise.then(function(){
				$scope.showChangePasswordForm = false;
				notificationService.showSuccessNotification('Successfully change your password');
			});
		};
		
		$scope.cancelChangePassword = function(){
			$scope.showChangePasswordForm = false;
		};
		
		$scope.acceptUser = function(user){
			dataSource.acceptUserActivation(user);
		};

		$scope.rejectUser = function(user){
			dataSource.rejectUserActivation(user);
		};


		
    }
]);
