angular.module('radialProgressService', [])
.factory('radialProgressService', function () {
	return {
		radialProgress: function radialProgress(parent, max) {
			var d3 = window.d3;

			var s = {
				duration: 1000,
				margin: { top: 0, right: 0, bottom: 0, left: 0 },
				width: 150,
				height: 150,
				diameter: 0,
				bound: {
					min: 0,
					max: max > 0 ? max: 100
				},
				goal: {
					outer: 3.14,
					inner: 6.28
				},
				data: [{ type: "outer", value: 0 }, { type: "inner", value: 0 }],
				arc: {
					outer: d3.svg.arc().startAngle(0 * (Math.PI/180)), // used by bg and outer
					inner: d3.svg.arc().startAngle(0 * (Math.PI/180)).endAngle(0)
				}
			};
			function drawBackground(group) {
				var background = group.append("g").attr("class","component");
				s.arc.outer.endAngle(360 * (Math.PI/180));
				background.append("path")
					.attr("transform", "translate(" + s.width/2 + "," + s.width/2 + ")")
					.attr("d", s.arc.outer);
			}
			function drawArcs(svg, mainGroup) {
				mainGroup.append("g").attr("class", "arcs");
				var paths = svg.select(".arcs")
					.selectAll(".arc")
					.data(s.data, function(d) {
						return d.type;
					}).enter().append('path')
					.attr("class", function(d) {
						return "arc "+d.type+"-arc";
					})
					.attr("transform", "translate(" + s.width/2 + "," + s.height/2 + ")")
					.attr("d", function(d) {
						return s.arc[d.type]();
					}).each(function(d) {
						var range = s.bound.max - s.bound.min,
							ratio = (d.value-s.bound.min)/range,
							endAngle = Math.min(360 * ratio, 360) * Math.PI/180;
						s.goal[d.type] = endAngle;
						d3.select(this).transition().duration(s.duration).attrTween("d", arcTween);
					});
			}
			function component() {
				d3.select(parent).each(function (data) {
					var svg = d3.select(this).append("svg"),
						mainGroup = svg.attr("class","radial-svg").append("g").attr("class", "main-group")
							.attr("transform", "translate(" + s.margin.left + "," + s.margin.top + ")");
					drawBackground(mainGroup);
					drawArcs(svg, mainGroup);
				});
			}
			function arcTween(d) {
				var i = d3.interpolate(0, s.goal[d.type]);
				return function(t) {
					return s.arc[d.type].endAngle(i(t))();
				};
			}
			function measure() {
				s.width =
					s.diameter -
					s.margin.right -
					s.margin.left -
					s.margin.top -
					s.margin.bottom;
				s.height = s.width;
				var halfw = s.width / 2,
					_80w = 0.95 * halfw,
					_20w = 0.05 * halfw;
				s.arc.outer.outerRadius(halfw);
				s.arc.outer.innerRadius(_80w);
				s.arc.inner.outerRadius(_80w);
				s.arc.inner.innerRadius(_80w - _20w);
			}
			component.render = function() {

				measure();
				component();
				return component;
			};
			component.data = function (_) {
				if (!arguments.length) {
					return s.data;
				} else {
					s.data = _;
					return component;
				}
			};
			component.margin = function(_) {
				if (!arguments.length) {
					return s.margin;
				} else {
					s.margin = _;
					return component;
				}
			};
			component.diameter = function(_) {
				if (!arguments.length) {
					return s.diameter;
				} else {
					s.diameter =  _;
					return component;
				}
			};
			component.minValue = function(_) {
				if (!arguments.length) {
					return s.bound.min;
				} else {
					s.bound.min = _;
					return component;
				}
			};
			component.maxValue = function(_) {
				if (!arguments.length) {
					return s.bound.max;
				} else {
					s.bound.max = _;
					return component;
				}
			};
			component.duration = function(_) {
				if (!arguments.length) {
					return s.duration;
				} else {
					s.duration = _;
					return component;
				}
			};
			return component;
		}
	};
});