angular.module('notification-service', [
	'ui-notification'
])
.config(function(NotificationProvider) {
	NotificationProvider.setOptions({
		delay: 2000,
		startTop: 20,
		startRight: 10,
		verticalSpacing: 20,
		horizontalSpacing: 20,
		positionX: 'left',
		positionY: 'bottom'
	});
})
.factory('notificationService', function (Notification) {
	return {
		showInfoNotification: function(message) {
			Notification.info(message);
		}, 
		showErrorNotification: function(message, persistence) {
			var messageTitle = '<i class="icon-error"></i><div class="subtitle">Ooops, something went wrong.</div>';
			Notification.error({message: message, title: messageTitle, delay: persistence ? 15000: 2000});
		},
		showSuccessNotification: function(message) {
			Notification.success({title: '<i class="icon-success"></i><div class="subtitle">' + message + '</div>'});
		}
	};
});