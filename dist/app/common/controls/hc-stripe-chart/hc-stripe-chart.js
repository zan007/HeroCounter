angular.module('controls.hcStripeChart', ['dataSource'])
.directive('hcStripeChart', ['$rootScope', 'dataSource', '$window', function($rootScope, dataSource, $window) {
	return {
		scope: {
			data: '=hcStripeChart'
		},
		restriction: 'E',
		replace: 'true',
		templateUrl: 'hc-stripe-chart',
		link: function($scope, $elem) {
			var data = [{"end_time":"Renegat","value":25.00},{"end_time":"Kocha","value":0.00},{"end_time":"Zoons","value":25.00}, {"end_time":"Orlica","value":125.00}];
			var stripeChart = function(element, width, height) {
				var d3 = window.d3;
				var component = {};

				var m = [30, 120, 50, 80],
					w = width - m[1] - m[3],
					h = height - m[0] - m[2];

				var x = d3.scale.ordinal().rangePoints([0, w]),
					y = d3.scale.linear().range([h, 0]),
					xAxis = d3.svg.axis().scale(x).orient("bottom"),
					yAxis = d3.svg.axis().scale(y).ticks(2).orient("right");

				var area = d3.svg.area()
					.interpolate("ordinal")
					.x(function (d) {
						return x(d.end_time);
					})
					.y0(h)
					.y1(function (d) {
						return y(d.value);
					});

				var line = d3.svg.line()
					.interpolate("linear")
					.x(function (d) {
						return x(d.end_time);
					})
					.y(function (d) {
						return y(d.value);
					});

				data.forEach(function (d) {
					d.end_time = d.end_time;
					d.value = +d.value;
				});

				var total = 0
				for (var i = 0, len = data.length; i < len; i++) {
					total += data[i].value;
				}

				x.domain(data.map(function(d) { return d.end_time; }));
				y.domain([0, d3.max(data, function (d) {
					return d.value;
				})]).nice();
				component.render = function() {
					if(d3.select('svg')){
						d3.select('svg').remove();
					}

					var svg = d3.select(element).append("svg:svg")
						.attr("width", w + m[1] + m[3])
						.attr("height", h + m[0] + m[2])
						.append("svg:g")
						.attr("transform", "translate(" + m[3] + "," + m[0] + ")");

					svg.append("svg:path")
						.attr("class", "area")
						.attr("d", area(data));

					svg.append("svg:g")
						.attr("class", "x axis")
						.attr("transform", "translate(1," + (h + 15) + ")")
						.call(xAxis);

					svg.append("svg:g")
						.attr("class", "y axis")
						.attr("transform", "translate(" + (w + 15) + ",0)")
						.call(yAxis);

					svg.selectAll("line.y")
						.data(y.ticks(2))
						.enter().append("line")
						.attr("x1", 0)
						.attr("x2", w)
						.attr("y1", y)
						.attr("y2", y)
						.style("stroke", "#000000")
						.style("stroke-dasharray", "5,5")
						.style("stroke-opacity", 0.1);

					svg.append("svg:path")
						.attr("class", "line")
						.attr("d", line(data));

					/*svg.append("svg:text")
						.attr("x", 80)
						.attr("y", -10)
						.attr("text-anchor", "end")
						.style("stroke", "#444")
						.style("fill", "#000")
						.style("stroke-width", .2)
						.style("font-size", "12px")
						.style("font-weight", "bold");

					svg.append("svg:text")
						.attr("x", w)
						.attr("y", -10)
						.attr("text-anchor", "end")
						.text('$' + total.toFixed(2) + " total")
						.style("stroke", "#008cdd")
						.style("fill", "#008cdd")
						.style("stroke-width", .2)
						.style("font-size", "12px")
						.style("font-weight", "bold");*/


						svg.selectAll("circle")
						.data(data)
						.enter().append("circle")
							.attr('class', 'chart-circle')
						.attr('cx', function (d) {
							return x(d.end_time);
						})
						.attr('cy', function (d) {
							return y(d.value);
						});

				}
				return component;
			}
			angular.element($window).bind('resize', function() {
				console.log('resize');
				var width = $elem.prop('offsetWidth');
				var height = $elem.prop('offsetHeight');
				stripeChart($elem[0], width, height).render();
			});

			var width = $elem.prop('offsetWidth');
			var height = $elem.prop('offsetHeight');
			stripeChart($elem[0], width, height).render();
		}
	};
}]);