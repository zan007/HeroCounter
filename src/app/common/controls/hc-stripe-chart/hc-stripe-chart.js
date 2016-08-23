angular.module('controls.hcStripeChart', ['dataSource'])
.directive('hcStripeChart', ['$rootScope', 'dataSource', '$window', function($rootScope, dataSource, $window) {
	return {
		scope: {
			data: '=hcStripeChart',
			nameField: '@',
			valueField: '@'
		},
		restriction: 'E',
		replace: 'true',
		templateUrl: 'hc-stripe-chart',
		link: function($scope, $elem) {

			var stripeChart = function(element, data, width, height) {
				var d3 = window.d3;
				var component = {};
				var nameField = $scope.nameField;
				var valueField = $scope.valueField;

				var m = [10, 70, 90, 20],
					w = width - m[1] - m[3],
					h = height - m[0] - m[2];

				var x = d3.scale.ordinal().rangePoints([0, w]),
					y = d3.scale.linear().range([h, 0]),
					xAxis = d3.svg.axis().scale(x).orient('bottom'),
					yAxis = d3.svg.axis().scale(y).ticks(2).orient('right');

				var area = d3.svg.area()
					.interpolate('ordinal')
					.x(function (d) {
						return x(d[nameField]);
					})
					.y0(h)
					.y1(function (d) {
						return y(d[valueField]);
					});

				var line = d3.svg.line()
					.interpolate('linear')
					.x(function (d) {
						return x(d[nameField]);
					})
					.y(function (d) {
						return y(d[valueField]);
					});

				data.forEach(function (d) {
					d[nameField] = d[nameField];
					d[valueField] =+ d[valueField];
				});

				var total = 0;
				for (var i = 0, len = data.length; i < len; i++) {
					total += data[i].valueField;
				}

				x.domain(data.map(function(d) { return d[nameField]; }));
				y.domain([0, d3.max(data, function (d) {
					return d[valueField];
				})]).nice();

				function wrap(text, width) {
					text.each(function() {
						var text = d3.select(this),
							words = text.text().split(/\s+/).reverse(),
							word,
							line = [],
							lineNumber = 0,
							lineHeight = 1.1, // ems
							y = text.attr('y'),
							dy = parseFloat(text.attr('dy')),
							tspan = text.text(null).append('tspan').attr('x', 0).attr('y', y).attr('dy', dy + 'em');
						while (word = words.pop()) {
							line.push(word);
							tspan.text(line.join(' '));
							if (tspan.node().getComputedTextLength() > width) {
								line.pop();
								tspan.text(line.join(' '));
								line = [word];
								tspan = text.append('tspan').attr('x', 0).attr('y', y).attr('dy', ++lineNumber * lineHeight + dy + 'em').text(word);
							}
						}
					});
				}

				component.render = function() {
					if(d3.select('svg')){
						d3.select('svg').remove();
					}

					var svg = d3.select(element).append('svg:svg')
						.attr('width', w + m[1] + m[3])
						.attr('height', h + m[0] + m[2])
						.append('svg:g')
						.attr('transform', 'translate(' + m[3] + ',' + m[0] + ')');

					svg.append('svg:path')
						.attr('class', 'area')
						.attr('d', area(data));

					svg.append('svg:g')
						.attr('class', 'x axis')
						.attr('transform', 'translate(40,' + (h + 25) + ')')
						.call(xAxis)
						.selectAll('text')
						.call(wrap, x.rangeBand())
						.attr('transform', 'rotate(65)');

					svg.append('svg:g')
						.attr('class', 'y axis')
						.attr('transform', 'translate(' + (w + 15) + ',0)')
						.call(yAxis);

					svg.selectAll('line.y')
						.data(y.ticks(2))
						.enter().append('line')
						.attr('x1', 0)
						.attr('x2', w)
						.attr('y1', y)
						.attr('y2', y)
						.style('stroke', '#000000')
						.style('stroke-dasharray', '5,5')
						.style('stroke-opacity', 0.1);

					svg.append('svg:path')
						.attr('class', 'line')
						.attr('d', line(data));

					/*svg.append('svg:text')
						.attr('x', 80)
						.attr('y', -10)
						.attr('text-anchor', 'end')
						.style('stroke', '#444')
						.style('fill', '#000')
						.style('stroke-width', .2)
						.style('font-size', '12px')
						.style('font-weight', 'bold');

					svg.append('svg:text')
						.attr('x', w)
						.attr('y', -10)
						.attr('text-anchor', 'end')
						.text('$' + total.toFixed(2) + ' total')
						.style('stroke', '#008cdd')
						.style('fill', '#008cdd')
						.style('stroke-width', .2)
						.style('font-size', '12px')
						.style('font-weight', 'bold');*/


						svg.selectAll('circle')
						.data(data)
						.enter().append('circle')
							.attr('class', 'chart-circle')
						.attr('cx', function (d) {
							return x(d[nameField]);
						})
						.attr('cy', function (d) {
							return y(d[valueField]);
						});

				};
				return component;
			};

			angular.element($window).bind('resize', function() {
				console.log('resize');
				var width = $elem.prop('offsetWidth');
				var height = $elem.prop('offsetHeight');
				stripeChart($elem[0], $scope.data, width, height).render();
			});
			console.log($scope.data);
			var width = $elem.prop('offsetWidth');
			var height = $elem.prop('offsetHeight');
			/*chartData = prepareData();
			stripeChart($elem[0], chartData, width, height).render();*/

			$scope.$watch('data', function(newVal, oldVal){
				console.log('data w pie chart', newVal, oldVal);
				if(newVal !== oldVal){
					console.log('stripe chart watch przy zmianie');
					stripeChart($elem[0], $scope.data, width, height).render();
				}
			});
		}
	};
}]);