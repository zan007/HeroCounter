angular.module('controls.hcPieChart', ['dataSource'])
.directive('hcPieChart', ['$rootScope', 'dataSource', '$window', function($rootScope, dataSource, $window) {
	return {
		scope: {
			data: '=hcPieChart',
			nameField: '@',
			valueField: '@'
		},
		restriction: 'E',
		replace: 'true',
		templateUrl: 'hc-pie-chart',
		link: function($scope, $elem) {
			var valueField = $scope.valueField;
			var nameField = $scope.nameField;

			var pieChart = function(element, data, width) {
				var d3 = $window.d3,
					m = [10, 10, 10, 10],
					w = width - m[1] - m[3],
					h = width - m[0] - m[2],
					r = h / 2,
					component = {};

				/*var data = [{'label': 'Category A', 'value': 20},
					{'label': 'Category B', 'value': 50},
					{'label': 'Category C', 'value': 30}];*/

				component.render = function() {
					/*if(d3.select('svg')){
						d3.select('svg').remove();
					}*/
					if(d3.select(element).select('.main-circle')){
						d3.select(element).select('.main-circle').remove();
					}
					var circle = d3.select(element)
						.append('svg:svg')
						.attr('class', 'main-circle');

					var vis = circle
						.data([data])
						.attr('width', w)
						.attr('height', h)
						.append('svg:g')
						.attr('transform', 'translate(' + r + ',' + r + ')');

					var pie = d3.layout.pie().value(function (d) {
						return d[valueField];
					});

					// declare an arc generator function
					var arc = d3.svg.arc().outerRadius(r);

					// select paths, use arc generator to draw

					var arcs = vis.selectAll('g.slice')
						.data(pie)
						.enter()
						.append('svg:g')
						.attr('class', 'slice');


					arcs.append('svg:path')

						.attr('d', function (d) {
							return arc(d);
						});

					// add the text
					arcs.append('svg:text').attr('transform', function (d) {
						d.innerRadius = w/7;
						d.outerRadius = r;

						return 'translate(' + arc.centroid(d) + ')rotate(' + angle(d) + ')';
					})
						.attr('fill', '#fff')
						.attr('class', 'chart-label')
						.attr('text-anchor', 'middle').text(function (d, i) {
						var currentElement = data[i];
						return currentElement[valueField] !== 0 ? currentElement[nameField]: '';
					});

					function angle(d) {
						var a = (d.startAngle + d.endAngle) * 90 / Math.PI - 90;
						return a > 90 ? a - 180 : a;
					}

				};

				return component;
			};

			var height = $elem.prop('offsetHeight');

			angular.element($window).bind('resize', function() {
				console.log('resize');
				height = $elem.prop('offsetHeight');
				pieChart($elem[0], $scope.data, height).render();
			});

			$scope.$watch('data', function(newVal, oldVal){
				if(newVal !== oldVal){
					pieChart($elem[0], $scope.data, height).render();
				}
			});
		}
	};
}]);