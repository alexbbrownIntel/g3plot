G3Plot
======

A demo framework for Shiny + D3 including ggplot-like aesthetic mapping and geoms.  

Written by Alex B Brown at Intel Corp, 2012-2013

Core idea: Pick a dataset, then describe how that data is mapped into a graph, using the handy-dangy ggplot2 like format.

Includes interactive features such as click and drag.

Add Shiny inputs to the app to control graph filtering and more.

Licence
-------

This will shortly receive and open source licence.  Please take care not to include
confidential information in this repository.

Usage as a demo app
-------------------

To run g3plot in demo mode, 

1) start R in this directory.
2) require(shiny)
3) runApp()

Note that if you run > require(plyr); require(reshape); require(Hmisc);
then additional datasets will appear in the sidebar, some of which have
plots already created.

Extending the demo app
----------------------

Look in plot.R and add some functions for other data sets.  If that gets old, go to plotinputs.R and add some of those.

If *that* gets old, start to create new graph types in javascript, or fix the html table logic.

Usage as your own app
---------------------

Checkout g3plot as a subdirectory of your Shiny Application and add the line

addResourcePath("js",tools:::file_path_as_absolute("./g3plot/js"))

To your server.R.

Then follow some of the examples in server.R and ui.R and friends to add 
javascript plots to your Shiny Application.

Note that you can still test the demo app by using

runApp("g3plot") from your application's R console.

Geoms
-----

Currently supports:

point
bar
point_bar
point_range_bar
line
voronoi (doesn't display but makes UI better)

Layout Structure
----------------

Ignoring text output, html, axes, legends

Common Name | Entity | Arity | Class           | File        | Message Part      | Description  
------------|--------|-------|-----------------|-------------|-------------------|-------
Document    | HTML   | 1     |                 | UI.R        | -                 | the web page
report      | DIV*   | n     | g3plotMultiPlex | g3widget.js | Array of arrays   | the shiny output
section     | DIV    | n     | pane            | g3report.js | Array of list(name=?)    | a single formatted d3 object - one of "plot" "list" or other text
figure+data | DIV    | 1     | plot            | g3plot.js   | ditto             | A combination of a drawing region with linked html table
figure      | SVG    | 1     | d3svg           | g3plot.js   | ditto             | A single drawing region with any contents
subfigure     | G      | n     | subplot         | g3subfigure.js   | List(name=?)      | container for a plot with distinct axes, data, legends
plot        | G      | 1     | plot            | g3plot.js   | ditto             | the bit inside the axes
y facet     | G      | J     | facet           | g3plot.js   | aesthetic(YFacet=?)          | the Jth horizontal slice with a personal clone of the Y scale
x facet     | G      | K     | y facet         | g3plot.js   | aesthetic(XCluster=?)| the Kth vertical slice of the Jth horizontal
geom        | ?      | many  | dot/bar/...     | g3geom.js   | aesthetic(geom=?) | an actual drawing component

TODO
----

Ideas for things that really need doing to make future work easier

 * Make HTMLtable way better.  Right now it consumes data in structure format with grid format applied to it.  This is great for some data types (such as long data that needs to go wide) but is hard to persuade to do what you really want
 * Muck out (decompose) the functions in g3plot.js - they are a grab bag of junk code
 * Clean up the structure and make message passing between layers better
 * Make filters smarter - can they be overlaid
 * Make zooming work (e.g. transiently zoom on a click)
 * Make writing message templates easier.  Ideas - some fields can be inferred from others, or have good defaults.  Beyond that, a wrapper called d3plot could guess what were good values.

Fun improvements:

 * Standardised way to add dynamic tooltips 
 * Standardised way to hover highlight nodes
 * Improved click dropzones (voronoi?)
 * click drag on axes to scale (near ends) or pan (in middle)

Some ideas to develop the product
 
 * Sparklines - providing a very simple 3-layer structure without faceting
 * Layers - multiple geoms on top of each other (another layer!)
 * g3autoplot - looks at data and does something sensible, then tells you how to repeat / customise it


Constraints
-----------

While this project could go in a number of dimensions, some routes may constrain it.  Here are some reasons not to constrain it:

* geoms may need to sit on top of multiple facets.  For instance a summary stat across the second-inner XCluster - e.g. average income for a whole state with subfacets for each county.
* It should be a learning aid; so while it's hard, lets keep things simple, and try to have simple versions of things to build upon.  For example, a line-drawer without animation, or exits, may be a whole lot simpler than one with, and animations and exits are far less important than non animated entries.  Similarly, abstracting too much d3 away may be a good or bad thing.
* The current layout is very complex - with 12 layers.  This is because it was a project goal to show exactly how fancy it could get.  Probably only 2 or 3 are actually necessary to make basic plots - let's build an alternate path to get there.  For example: a Sparkline with only two layers.  By preferring that they keep the same innermost components,  this will help keep the project flexible.