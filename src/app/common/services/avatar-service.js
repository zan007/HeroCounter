angular.module('avatarService', [])
	.factory('avatarService', ['$q', 'notificationService', function ($q, notificationService) {
		return {
			uploadAvatar: function(files){

			},
			readImageFile: function(file){
				var deferred = $q.defer();

				if(window.FileReader){
					if(file.size > 4000000){
						notificationService.showErrorNotification('Error, photo exceeds max size limit.');
						deferred.reject();
					}
					if(!file.type.match('image.*')){
						notificationService.showErrorNotification('Error, file must be a photo.');
						deferred.reject();
					}

					var reader = new FileReader();
					reader.onloadend = function (event) {
						if(event.target.error != null){
							notificationService.showErrorNotification('Error, please try another photo.');
							deferred.reject();
						}
						else {
							deferred.resolve(reader.result);
						}
					};
					reader.readAsDataURL(file);
				} else {
					notificationService.showErrorNotification("Sorry, this browser doesn't support photo uploads.");
					deferred.reject();
				}

				return deferred.promise;
			}
		};
	}]);