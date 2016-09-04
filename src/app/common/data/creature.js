angular.module('data.creature', [])

	.factory('creature', ['$http', '$q', '$rootScope', '$location', 'notificationService', 'locales', 'call',
		function($http, $q, $rootScope, $location, notificationService, locales, call) {
			//var call = dataSource.call;
			var creature = {
				defeatCreature: function(creature) {
					return call({ method: 'POST',
						url: '/defeat',
						data: {
							creatureName: creature.name
						}
					}, function(data) {
						//updateCreatures(data.creatures);
						//$rootScope.model.creatures = data.creatures;
						//$rootScope.$broadcast('dataSource.ready');
					});
				},
				reportDefeat: function(creature, date, reporterToken) {
					return call({ method: 'POST',
						url: '/reportDefeat',
						data: {
							creature: creature,
							date: date,
							reporterToken: reporterToken
						}
					}, function(data) {
						console.log('report defeat', data);
						//$rootScope.model.creatures = data.creatures;
						//$rootScope.$broadcast('dataSource.ready');
					});
				},
				updateCreatures: function(creatures) {
					for(var i = 0, len = creatures.length; i < len; i++){
						for(var j = 0, length = $rootScope.model.creatures.length; j < length; j++) {
							if ($rootScope.model.creatures[j].name === creatures[i].name) {
								$rootScope.model.creatures[j] = creatures[i];
								break;
							}
						}
					}
					//angular.extend($rootScope.model.creatures, creatures, $rootScope.model.creatures);
					$rootScope.$broadcast('dataSource.ready');
				},
				addEvent: function(event) {
					var addIndex = 0;
					for(var i = 0, len = $rootScope.model.events.length; i < len; i++){
						var currentEvent = $rootScope.model.events[i];
						var eventToAddTimestamp = moment(event.battleDate || event.reportDate).valueOf();
						var currentEventTimestamp = moment(currentEvent.battleDate || currentEvent.reportDate).valueOf();

						if(currentEventTimestamp <= eventToAddTimestamp) {
							addIndex = i;
							break;
						}
					}
					$rootScope.model.events.splice(addIndex, 0, event);
					/*$rootScope.model.events.unshift(event);*/
					$rootScope.$broadcast('dataSource.ready');
				},
				getCreatureProfile: function(creatureId) {
					return call({
						method: 'GET',
						url: '/creatureProfile',
						params: {
							creatureId: creatureId
						}
					}, function(data){

					});
				},
				getCreatureAnalyze: function (creatureId) {
					return call({
						method: 'GET',
						url: '/creatureAnalyze',
						params: {
							creatureId: creatureId
						}
					});
				},
				getEvents: function(fromTimestamp, toTimestamp) {
					return call({
						method: 'POST',
						url: '/getEvents',
						data: {
							fromTimestamp: fromTimestamp,
							toTimestamp: toTimestamp
						}
					}, function(data){
						$rootScope.model.events = $rootScope.model.events.concat(data);
						$rootScope.$broadcast('dataSource.ready');
						console.log('nowe eventy ', data);
					});
				},
			};

			return creature;
		}]);