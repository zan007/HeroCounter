angular.module('notification-service', [
	'ui-notification'
])
.config(function(NotificationProvider) {
	NotificationProvider.setOptions({
		delay: 10000,
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
		}
	}
});