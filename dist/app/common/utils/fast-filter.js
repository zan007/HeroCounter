angular.module('utils.fastFilter', []).

factory('fastFilter', ['$filter','$rootScope', function($filter,$rootScope) {
	return {
		create: function(filtersChain, initialFilterObj) {
			var filterDescs = filtersChain.replace(/\s+/g, '').split("|"),
					filters = [], 
					filtersOrdered = [],
					paramsMapping = [];

			for(var i = 0; i < filterDescs.length; i++) {
				var filterMeta = filterDescs[i].split(":"),
					filterName = filterMeta[0],
					filterParams = filterMeta.slice(1);

				filtersOrdered[i] = filterName;
				filters[filterName] = {
					name: filterName,
					params: filterParams,
					run: function(input, filterObj) {
						var paramValues = [input],
							paramNames = this.params;
						
						for(var i = 0; i < paramNames.length; i++)
							paramValues[i + 1] = filterObj[paramNames[i]];
						
						return $filter(this.name).apply(this, paramValues);
					},
					cached: undefined,
					order: i
				};

				for(var p = 0; p < filterParams.length; p++)
					paramsMapping[filterParams[p]] = i;
			}

			function getFirstDirtyFilter(filterObj) {
				var dirtyFilters = [];
				for(var param in filterObj) {
					if (filterObj.hasOwnProperty(param) && 
						!angular.equals(filterObj[param], oldFilterObj[param])) {
							dirtyFilters.push(paramsMapping[param]);
					}
				}
				if (!dirtyFilters.length)
					return null;
						
				return filtersOrdered[Math.min.apply(Math, dirtyFilters)];
			}

			function runFiltersFromChain(chain, input, filterObj) {
				if (chain.length == 0)
					return input;

				var filter = filters[chain[0]];
				filter.cached = input;
				return runFiltersFromChain(chain.slice(1), filter.run(input, filterObj), filterObj);
			}

			var oldInput = undefined,
				oldFilterObj = initialFilterObj,
				lastResult = undefined;

			return {
				filter: function(input, filterObj) {
					if (!input)
						return input;
										
					var filterName = filtersOrdered[0];
					if (oldFilterObj && input == oldInput) {
						filterName = getFirstDirtyFilter(filterObj);
						if (!filterName)
							return lastResult;
					}
					if (oldInput != input)
						for(var key in filters) delete filters[key].cached;

					oldInput = input; 
					oldFilterObj = angular.copy(filterObj);

					var filtersToExecute = filtersOrdered.slice(filters[filterName].order);

					if (filtersToExecute.length > 0) {
						var firstFilter = filters[filtersToExecute[0]];
						return lastResult = runFiltersFromChain(filtersToExecute, 
							(firstFilter.cached === undefined) ? input : firstFilter.cached,
							filterObj);
					}

					return input;
				},
				get: function() {
					return angular.copy(oldFilterObj);
				}
			}
		}
	}
}]);