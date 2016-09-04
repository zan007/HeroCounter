angular.module('data.context', [])

.factory('context', ['$http', '$q', '$rootScope', '$location', 'notificationService', 'locales', 'call',
	function($http, $q, $rootScope, $location, notificationService, locales, call) {
		//var call = dataSource.call;
		var context = {
			setLanguage: function(lang){
				return call({
					method: 'POST',
					url: '/setLanguage',
					data: {
						lang: lang
					}
				});
			},
			getLanguage: function(){
				return call({
					method: 'GET',
					url: '/getLanguage'
				});
			},
			init: function(){
				return call({method: 'GET',
					url: '/init',
					data: {}
				}, function(data) {
					//var data = response.data;

					$rootScope.model.creatures = data.creatures;
					$rootScope.model.personalData = data.personalData;
					$rootScope.model.events = data.events;
					$rootScope.model.users = data.users;

					$rootScope.$broadcast('dataSource.ready');
				});
			}
		};

		return context;
	}]);