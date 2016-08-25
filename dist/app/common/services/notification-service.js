angular.module('notificationService', [
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
.factory('notificationService', ['locales', 'Notification', function(locales, Notification) {
	return {
		showInfoNotification: function(message, persistence) {
			Notification.info({title: '<i class="icon-info-circled"></i><div class="subtitle">' + message + '</div>', delay: persistence ? 15000: 2000});
		}, 
		showErrorNotification: function(message, persistence) {
			var messageTitle = '<i class="icon-error"></i><div class="subtitle">'+locales.error.header+'</div>';
			Notification.error({message: message, title: messageTitle, delay: persistence ? 15000: 2000});
		},
		showSuccessNotification: function(message, persistence) {
			Notification.success({title: '<i class="icon-success"></i><div class="subtitle">' + message + '</div>', delay: persistence ? 15000: 2000});
		}
	};
}]);