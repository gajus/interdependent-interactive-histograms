# Interdependent Interactive Histograms

This is a helper function that utilises [d3.js](http://d3js.org/) and [Crossfilter](http://square.github.com/crossfilter/) to create interdependent interactive histograms ([demonstration](https://dev.anuary.com/703dff31-b9be-543f-b6c6-61ae7fb4dd32/)). The beauty of the code comes from the flexibility of the input data and addaptability to the environment. The crossfilter object can have an arbitrary number of groups, of any size. The graph will automatically adapt to the container width and height and introduce a horizontal scrollbar if such is needed. 

## Usage

To begin with, I encourage you to explore the [demonstration](https://dev.anuary.com/703dff31-b9be-543f-b6c6-61ae7fb4dd32/) source code. http://xhprof.io is a [real-life example](https://dev.anuary.com/8d50658e-f8e0-5832-9e82-6b9e8aa940ac/?ay[template]=requests) utilising the code. The available function parameters are documented in the code. Defining the Crossfilter `dimension` and `group` is enough to populate the graph with data. Nevertheless, you need to familirize with the [Crossfilter API](https://github.com/square/crossfilter/wiki/API-Reference). 

`ay_histogram` returns object that gives access to the [brush tool](https://github.com/mbostock/d3/wiki/SVG-Controls#wiki-brush) callback (`render`) and a `setRelations` function that is used to delegate relations with the other `ay-histogram` instances or independant functions.

    var a	= ay_histogram('histogram-a', data.a, {margin: [10, 10], bin_width: 100, x_axis_format: d3.format('d')});
    var b	= ay_histogram('histogram-b', data.b, {margin: [10, 10], bin_width: 1000, tick_width: 100});
    var c	= {render: function(){ /* this will be triggered whenever dependant histogram brush tool is used */ }};

    a.setRelations([b,c]);
    b.setRelations([a,c]);

### The available options

* `(array) margin`. `[(int) horizontal, (int) vertical]` margin within the SVG element.
* `(int) bin_width`. Define the bin size, eg. if data is grouped using `d3.time.hour` then `bin_width` it is *3600*1000*.
* `(function) x_axis_format`. Every tick value will be passed through this function. You may want to take a look at the [d3 Formatting](https://github.com/mbostock/d3/wiki/Formatting).
* `(int) tick_width`. Defines a rough distance between every tick label.


## Roadmap

* No known bugs.
* Feature. Resize the graph on `window` resize.

## License & Notes

The BSD License - Copyright (c) 2012 Gajus Kuizinas.