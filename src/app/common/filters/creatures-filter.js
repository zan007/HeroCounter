angular.module('filters.creaturesFilter', [
	'creatureTypeFilter', 
	'creatureLvlFilter', 
	'respTimeFilter', 
	'utils.fastFilter',
	'creaturesQueryFilter',
	'onlyWithKnownTimeFilter'
])

.factory('creaturesFilter', ['$rootScope', 'fastFilter', function($rootScope, fastFilter) {
    return fastFilter.create("onlyWithKnownTimeFilter:onlyWithKnownTime | creatureTypeFilter:creatureType | creatureLvlFilter:lvlRange | creaturesQueryFilter:queryInput | respTimeFilter:hoursToResp:onlyWithKnownTime", {
        creatureType: {
        	titan: true,
        	hero: true
        },
        lvlRange: {
        	minValue: 20,
        	maxValue: 320
        },
        hoursToResp: 2,
        onlyWithKnownTime: true
    });
}]);