$(function(){
	var data	= [];
		
	var getRandomInt	= function(min, max)
	{
	  return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	
	for(var i = 0; i < 1000; i++)
	{
		data.push({
			date: new Date(2012, getRandomInt(8,9), getRandomInt(1,30)),
			mu: getRandomInt(0,9999)
		});
	}
	
	(function(input){
		'use strict';
		
		/**
		 * param	string	name	Unique (per-DOM) name for the graph.
		 * param	object	data	{group: (crossfilter group), dimension: (crossfilter dimension)}
		 * param	object	options	{ (required) margin: [(int), (int)], (required for d3.linear.scale) step_size: (int), (optional) axis_format: (function)}
		 */
		var graph		= function(name, data, options)
		{
			var svg	= d3
				.select('svg.' + name);
			
			var dimensions	=
			{
				brush:
				{
					bar: { width: 10 }
				},
				scrollbar: { height: 10 },
				axis:
				{
					x: { height: 20 }
				},
				graph:
				{
					width: svg[0][0].getBoundingClientRect().width-options.margin[0]*2
				}
			};
			
			// the magic 1 refers to the scrollbar stroke width
			dimensions.graph.height	= svg[0][0].getBoundingClientRect().height-options.margin[1]*2-dimensions.scrollbar.height-dimensions.axis.x.height-1;
			
			var all		= data.group.all();
			
			var y		=
			{
				max: d3.max(all, function(e){ return e.value; })
			};
			
			y.scale		= d3.scale.linear().range([0, dimensions.graph.height]).domain([0, y.max]);
			y.scale2	= d3.scale.linear().range([0, dimensions.graph.height]).domain([y.max, 0]);
			
			// the x-axis related calculations need be done only when the graph is initialised
			if(svg.select('g').empty())
			{
				var brush		=
				{
					events:
					{
						brush: function()
						{
							var extent 		= brush.d3.extent();
							
							var scale		= extent.map(x.scale).map(function(d){ return Math.ceil(d/dimensions.brush.bar.width)*dimensions.brush.bar.width; });
							
							var extent		= [x.scale.invert(scale[0]), x.scale.invert(scale[1])];
							
							if(scale[0] == scale[1])
							{
								data.dimension.filterAll();
							}
							else
							{
								data.dimension.filterRange(extent);
							}
							
							brush.g.call(brush.d3.extent(extent));
							
							clippath_brush
								.attr('x', scale[0])
								.attr('width', scale[1]-scale[0]);
								
							render(name);
						}
					},
					// A helper method to generate the handle-bars for the brush tool.
					// @author Mike Bostock
					resize_path: function(d)
					{
						var e = +(d == "e"),
							x = e ? -1 : 1,
							y = dimensions.graph.height / 3;
						
						var b = e ? 0 : 1;
						
						return "M" + (.5 * x) + "," + (y)
							+ "A5,5 0 0 " + b + " " + (6.5 * x) + "," + (y + 6)
							+ "V" + (2 * y - 6)
							+ "A5,5 0 0 " + b + " " + (.5 * x) + "," + (2 * y)
							+ "Z"
							+ "M" + (2.5 * x) + "," + (y + 8)
							+ "V" + (2 * y - 8)
							+ "M" + (4.5 * x) + "," + (y + 8)
							+ "V" + (2 * y - 8);
					}
				};
				
				var x			= 
				{
					extent: d3.extent(all, function(d){ return d.key; })
				};
				
				// This is used to automatically differentiate between time scale
				// and other kind of quantitative groups.
				if(typeof all[0].key === 'object')
				{
					// cannot use all.length because crossfilter data length does not reflect data-gaps
					var days		= Math.round((x.extent[1].getTime()-x.extent[0].getTime())/ (1000*60*60*24));
					
					var graph_width	= (days+1) * dimensions.brush.bar.width
					
					// create the upper data boundry
					x.extent[1]		= new Date(x.extent[1].getTime() + 24*60*60*1000);
				
					x.scale			= d3.time.scale().domain(x.extent).rangeRound([0, graph_width]);	
				}
				else
				{
					if(!options.step_size)
					{
						throw 'step_size is a required option for non-date histogram.';
					}
					
					var data_length	= data.group.all().length;
					
					//
					
					// cannot use all.length because crossfilter data length does not reflect data-gaps
					//var data_length	= Math.ceil(x.extent[1]/options.step_size+1);
					
					//console.log( data_length, options.step_size );
					
					//return;
					
					var graph_width	= data_length * dimensions.brush.bar.width
					
					// create the upper data boundry
					//x.extent[1]		+= options.step_size;
				
					x.scale			= d3.scale.linear().domain(x.extent).rangeRound([0, graph_width]);
				}
				
				x.axis	= d3.svg.axis()
						.tickPadding(5)
						.tickSize(5)
						.scale(x.scale);				
				
				if(typeof options != 'undefined' && options.axis_format)
				{
					x.axis.tickFormat(options.axis_format);
				}
				
				// graph
				var graph			= svg
					.append('g')
						.attr('class', 'gragh')
						.attr('clip-path', 'url("#clippath-graph-' + name + '")')
						.attr('transform', 'translate(' + options.margin.join(',') + ')');
				
				var foreground	= graph
					.append('g')
						.attr('class', 'foreground')
				
				// Create a gray graph that is displayed when there is no
				// active brush selection.
				foreground
					.selectAll('rect')
						.data(all)
						.enter()
						.append('rect')
							.attr('width', function(){ return dimensions.brush.bar.width-1; })
							.attr('x', function(d){ return x.scale(d.key); });
				
				// This is the graph that is revealed using the brush tool.
				var background	= graph
					.append('g')
						.attr('class', 'background')
						.attr('clip-path', 'url("#clippath-brush-' + name + '")');
						
				background
					.selectAll('rect')
						.data(all)
						.enter()
						.append('rect')
							.attr('width', function(){ return dimensions.brush.bar.width-1; })
							.attr('x', function(d){ return x.scale(d.key); });
				
				graph
					.append('g')
						.attr('class', 'axis x')
						.attr('transform', 'translate(0,' + dimensions.graph.height + ')')
						.call(x.axis);
				
				var y_axis	= svg
					.append('g')
						.attr('class', 'axis y')
						.attr('transform', 'translate(' + options.margin.join(',') + ')');
				
				// brush
				var clippath_brush	= svg.append('clipPath')
					.attr('id', 'clippath-brush-' + name)
						.append('rect')
						.attr('height', dimensions.graph.height);
				
				brush.d3	= d3.svg.brush()
					.x(x.scale)
					.on('brush', brush.events.brush)
				
				brush.g	= graph
					.append('g')
						.attr('class', 'brush')
						.call(brush.d3);
						
				brush.g
					.select('rect.background')
						.attr('width', graph_width);
						
				brush.g
					.selectAll('rect')
						.attr('height', dimensions.graph.height);
					
				brush.g
					.selectAll('.resize')
						.append('path')
							.attr('d', brush.resize_path);
				
				// scrollbar
				if(dimensions.graph.width/graph_width < 1)
				{
					
					var scrollbar_width		= Math.floor((dimensions.graph.width/graph_width)*dimensions.graph.width);
					
					
					
					var clippath_graph		= svg.append('clipPath')
						.attr('id', 'clippath-graph-' + name)
							.append('rect')
								.attr('width', dimensions.graph.width)
								.attr('height', dimensions.graph.height+dimensions.axis.x.height);
					
					
					
					
					var drag			= d3.behavior.drag().on('drag', function(){
						var scrollbar_x		= parseInt(d3.select(this).attr('x'));
						var scrollbar_width	= parseInt(d3.select(this).attr('width'));
						var move_x			= scrollbar_x+d3.event.dx;
						
						if(move_x < 0 || move_x + scrollbar_width > dimensions.graph.width)
						{
							return;
						}
						
						var x	= Math.floor(move_x*(graph_width/dimensions.graph.width));
						
						graph.attr('transform', 'translate(' + (-1*x+options.margin[0]) + ',' + options.margin[1] + ')');
						
						clippath_graph.attr('transform', 'translate(' + (x) + ',0)');
						
						d3.select(this).attr('x', move_x);						
					});
					
					var scrollbar			= svg.append('rect')
						.attr('class', 'scrollbar')
						.attr('width', scrollbar_width)
						.attr('height', dimensions.scrollbar.height)
						.attr('transform', 'translate(' + options.margin[0] + ',' + (dimensions.graph.height+options.margin[1]+dimensions.scrollbar.height+dimensions.axis.x.height) + ')')
						.attr('x', dimensions.graph.width-scrollbar_width)
						.attr('y', 0)
						.call(drag);
					
					// initial graph offset
					var offset	= graph_width-dimensions.graph.width+1;
					
					clippath_graph.attr('transform', 'translate(' + (offset) + ',0)');
					
					graph.attr('transform', 'translate(' + (-1*offset+options.margin[0]) + ',' + options.margin[1] + ')');
				}
			}
			else
			{
				var y_axis			= svg.select('g.axis.y')
				var foreground		= svg.select('g.foreground');
				var background		= svg.select('g.background');
			}
			
			y.axis			= d3.svg.axis()
						.tickPadding(5)
						.tickSize(5)
						.scale(y.scale2)
						.orient('right');
						
			y_axis.call(y.axis);
			
			foreground
				.selectAll('rect')
					.data(all)
						.attr('y', function(d){ return dimensions.graph.height-y.scale(d.value); })
						.attr('height', function(d){ return y.scale(d.value); });
			
			background
				.selectAll('rect')
					.data(all)
						.attr('y', function(d){ return dimensions.graph.height-y.scale(d.value); })
						.attr('height', function(d){ return y.scale(d.value); });
		};
		
		// This function is called to initialise the graph and re-render
		// the bars when the brush tool is triggered.
		var render		= function(name)
		{
			if(name != 'histogram-a')
			{
				graph('histogram-a', {group: data.a_group, dimension: data.a}, {margin: [20, 10]});
			}
			
			if(name != 'histogram-b')
			{
				graph('histogram-b', {group: data.b_group, dimension: data.b}, {margin: [20, 10], step_size: 100});
			}
			
			if(name != 'histogram-c')
			{
				graph('histogram-c', {group: data.c_group, dimension: data.c}, {margin: [20, 10], step_size: 100});
			}
		};
		
		var data		=
		{
			crossfilter: crossfilter(input)
		};
		
		data.a			= data.crossfilter.dimension(function(d){ return d3.time.day(d.date); });
		data.a_group	= data.a.group();
		
		data.b			= data.crossfilter.dimension(function(d){ return d.mu; });
		data.b_group	= data.b.group(function(d){ return Math.floor(d / 100); });
		
		data.c			= data.crossfilter.dimension(function(d){ return d.mu; });
		data.c_group	= data.c.group(function(d){ return Math.floor(d / 100); });
		
		render();
	})(data);
});