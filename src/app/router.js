angular.module('router', []).

provider('routes', function() {
	var routes = [
			{title: 'LOGIN', path: '/', icon: 'icon-circle', selected: true},
			{title: 'REGISTER', path: '/register', icon: 'icon-circle', selected: false},
			{title: 'HEROES', path: '/heroes', icon: 'icon-circle', selected: false},
			{title: 'TITANS', path: '/titans', icon: 'icon-circle', selected: false},
			{title: 'EVENT HEROES', path: '/event-heroes', icon: 'icon-circle', selected: false},
			{title: 'EVENT TITANS', path: '/event-titans', icon: 'icon-circle', selected: false}
		],
		defaultRoute = routes[0];

	this.$get = function() {

		return {
			register: function($routeProvider) {
			    var routeProvider = $routeProvider;

			    for(var i = 0; i < routes.length; i++)
			    	routeProvider = routeProvider.when(routes[i].path, { idx: i });	
			    routeProvider.otherwise({ redirectTo: '/' })
			},
			select: function(route) {
				for(var i = 0; i < routes.length; i++)
					routes[i].selected = false;
				route.selected = true;				
			},
			getList: function() {
				return routes;
			},
			getLoginList: function() {
				var loginRoutes = [routes[0], routes[1]];
				return loginRoutes;
			},
			getAfterLoginList: function() {
				return [{title: 'HEROES', path: '/heroes', icon: 'icon-circle', selected: false},
			{title: 'TITANS', path: '/titans', icon: 'icon-circle', selected: false},
			{title: 'EVENT HEROES', path: '/event-heroes', icon: 'icon-circle', selected: false},
			{title: 'EVENT TITANS', path: '/event-titans', icon: 'icon-circle', selected: false}];
			}
		}
	}
}).

config(['$routeProvider', '$locationProvider', 'routesProvider',
  function($routeProvider, $locationProvider, routesProvider) {
    routesProvider.$get().register($routeProvider);
    $locationProvider.html5Mode(true);
}]).

directive('router', ['routes', '$location', 'dataSource', 'userAuthService', function(routes, $location, dataSource, userAuthService) {
	return {
		restrict: 'A',
		controller: ['$scope', '$attrs', function($scope, $attrs) {
			var model = $scope[$attrs.router] || {};
			var routesList = routes.getList();
			
			$scope.$on('$routeChangeSuccess', function(evt, routeData) {
				if (!routeData.$$route)
					return; 
				$scope[$attrs.router] = routesList[routeData.$$route.idx];
				routes.select($scope[$attrs.router]);
			});

			this.setRoute = function(route) {
				
				//if(userAuthService.isLogged){
					$scope[$attrs.router] = route;
					routes.select(route);
					$location.path(route.path);
				/*} else {
					var route = {title: 'LOGIN', path: '/', icon: 'icon-circle', selected: true};
					$scope[$attrs.router] = route;
					routes.select(route);
					$location.path('/');
				}*/
			}
		}]
	}
}]).	

directive('routeTo', function() {
	return {
		restrict: 'A',
		require: '^router',
		scope: {
			item: '=routeTo',
			initCombo: '@'
		},
		link: function($scope, $element, $attrs, routerCtrl) {
			var evt = "ontouchstart" in document.documentElement ? 'touchstart' : 'mousedown';
			$element.bind(evt, function() {
				routerCtrl.setRoute($scope.item);
				$scope.$apply();
			});
		}
	}
});