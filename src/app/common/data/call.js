angular.module('data.call', [])

.factory('call', ['$http', '$q', '$rootScope', '$location', 'notificationService', 'locales',
	function($http, $q, $rootScope, $location, notificationService, locales) {
		//var call = dataSource.call;
		return function(httpData, responseFn) {
				$rootScope.$broadcast('dataSource.start');

				var promise = $http(httpData).then(function(response) {
					var result;
					if (responseFn) {
						result = responseFn(response.data, response.status, response.headers);
					}
					$rootScope.$broadcast('dataSource.stop');

					return result || response.data;

				}).then(null, function(reason) {
					console.log(reason);
					if (reason.data.code) {
						notificationService.showErrorNotification(reason.data.code ? locales.errorCodes[reason.data.code] : '', reason.data.persistence);
					}
					$rootScope.$broadcast('dataSource.error');
					return $q.reject(reason);
				});

				return promise;


			};
	}]);