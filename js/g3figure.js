/* 
 g3figure manages an svg containing n independent plots plus a data table

 called by: g3report.js

 This file is almost the outermost layer - and represents the 'figure + data(table)'
 The figure is composed of one or more practically independent subfigures which can
 have completely separate axes, scales and legends.

 --------------------------------
 |figure+table  (this)          |
 |  --------------------------  |
 |  |figure                  |  |
 |  | ----------- ---------- |  |
 |  | | subfig  | | subfig | |  |
 |  | ----------- ---------- |  |
 |  --------------------------  |
 |  
 |  --------------------------  |
 |  | table |  |  |  |  |  | |  |
 |  --------------------------  |
 --------------------------------

 It also includes some dynamic event handling for UI clicks

*/

(function(exports){

  // Return or build the element skeleton for the plot widget
  // and destroy or re-use exiting plots.
  exports.skeleton = function(el) {
    var plotNode=d3.select(el)
        .selectAll("div.figure")
        .data(["figure"])
    plotNode.enter()
      .append("div").attr("class","figure")
      .each(function(){
        var s = d3.select(this)
        s.append("svg")
         .attr("class","d3svg")
        s.append("table")
         .attr("class","d3Table")
        return s;
      })
      
    plotNode.exit().remove();
    return plotNode
  }

  // 
  // Core plot control
  //

  // create or update the plot object.
  // this is a div with an svg and a table
  // the svg contains subFigure and facets for multiple
  // plots and axes.
  // el is the g3figure > content > pane element for this 
  // plot.  It will (or does) contain a div.plot node, containing some of svg, table.
  // 
  // this function is a MESS
  exports.newPlot = function(el,message) {
    if (!_.isArray(message)) {
      message = [message]
    }
    
    var plans = message.map(_.partial(g3message.loadMessage,el))
    
    // Resize logic http://stackoverflow.com/questions/14265112/d3-js-map-svg-auto-fit-into-parent-container-and-resize-with-window
    var dimensions1 = {
      width:el.clientWidth,
      height:500
    }
    
    // auto resizing.  should do per svg really.
    // This doesn't work right now - only operates when you load a new plot.
    $(window).on('resize.allplots', function(){
       if(this.resizeTO) clearTimeout(this.resizeTO);
        this.resizeTO = setTimeout(function() {
            $(this).trigger('resizeEnd');
        }, 500);   
    })

    $(window).bind('resizeEnd', function() {
        var width = el.clientWidth;
        // resizing svg may not be the right thing to do in some future facet wrap plot.
        //d3.select(el).select("svg.d3svg").attr("width", width);
        //draw(height); // need to do this -right now the sizer is a mess (see below)
    });

    // Scan the plot spec for dimensions
    var overrideHeight = 0;
    plans.map(function(plan,i) {
      if (plan.data.message.dimensions
        && plan.data.message.dimensions.height)
        overrideHeight += plan.data.message.dimensions.height
    })
    
    if (overrideHeight > 0)
      dimensions1.height = overrideHeight
    
    // create (or re-use) a div.plot+children nodes
    this.skeleton(el)
    
    var svg = d3.select(el).select("svg");
    var root = svg
      .attr("width",  dimensions1.width)
      .attr("height", dimensions1.height)
      
    g3patterns.grayGradient(svg)


    // Note: filter is TOO GLOBAL at the moment.  I don't know what its scope should
    // be - a subfigure?  a dataset?  both seem too restrictive.
    
    // unfilter to remove the effects of visual filters such as opacity and HTML
    // table effects BEFORE updating the graph, since (and if it has the same name 
    // or no name at all) the filtered components may be re-used in the new graph and
    // leave visual artefacts.
    try { g3figure.filter && g3figure.filter.unfilter && g3figure.filter.unfilter() }
    catch(e) { 
      // just consume if it fails.  It can fail in particular if the name is the
      // same between old and new plots but they are not actually compatible.
      delete g3figure.filter.unfilter; 
      //e.message = "Cannot remove filter (just retry): "+e.message;
      //throw(e)
      
    } // this will throw if you select USArrests and then unselect

    g3figure.filter();
    g3figure.filter.clear()

    // It'd be nice to move all these dimension calculations elsewhere, possibly get
    // the HTML layout engine to calculate it by creating a shadow table or div layout
    // and extracting the relevant sizes from that.
    var heightScaleFn=function(plan){return ((plan.data.message.widgets&&plan.data.message.widgets.size&&(plan.data.message.widgets.size=='mini'))?1:4)}

    // calculate the dimensions of each of the subfigures, scaled appropriately to the
    // size of the container.
    var totalHeightScale = 
      plans.reduce(function(y,plan){return y+heightScaleFn(plan)},0)

    var cumulativeHeightScale = 
      plans.reduce(function(cumulativeHeight,plan,i) {
      // calculate the outer dimensions of each plot from the plan
      var dimensions = {
        id : i,
        outerHeight : dimensions1.height*heightScaleFn(plan)/totalHeightScale,
        outerWidth : dimensions1.width,
      }
      dimensions.top = dimensions1.height*cumulativeHeight/totalHeightScale
      plan.dimensions = dimensions
      return cumulativeHeight + heightScaleFn(plan)
    },0)
    
    // subFigure are multiple distinct plots in the same drawing area
    var subFigure = root.selectAll("g.subfigure").data(plans,function(d){
        return d.name
      })
      .call(g3figure.doSubFigure)
      .each(function(d,i) {
        g3figure.filter.addWidget(d.subfigure.filterHandle());
      })
    
    if(plans.length == 0 || plans[plans.length-1].data.message.grid == null){ 
      // need to remove the table
      d3.select(el).select(".d3Table").select("table").remove()
      // and turn off the filters.  um, why?
      //exports.filter.clear()
    } else {
      // It should mean - draw a table for each subFigure that wants one.  But I only
      // know how to draw one table at the moment so only the last one that wants one
      // right now it does 'if the last plan wants a table' do it.
      if(plans[plans.length-1].data.message.grid != null) {
        exports.filter.addWidget(g3figure.table(d3.select(el).select(".d3Table"),plans[plans.length-1])); 
      }
    }
  }

  // construct the subfigure.  This could really go in g3subfigure but the different OO model 
  // used there won't play nicely.  I'll need to invert a bunch of logic to achieve this.
  exports.doSubFigure = function doSubFigure(subFigure) {
  
    // build the skeleton for the subplot
    subFigure.enter().append("g").attr("class","subfigure").each(function(){
      var s=d3.select(this);
      s.attr("width",function(d){return d.dimensions.outerWidth})
      s.attr("height",function(d){return d.dimensions.outerHeight})
      s.append("g").attr("class","xaxis axis") // actually all manner of x things - brush zoom axis
      s.append("g").attr("class","plot")
      s.append("g").attr("class","xaxisDecorate axis").append("text").attr("class","guidelabel")
      s.append("g").attr("class","legend").append("text").attr("class","guidelabel")
    })
    subFigure.exit().remove();
    
    // returns length of (first?) valid aesthetic or undefined if none
    var hasAesthetic = function hasAesthetic(plan,aesthetic) {
      // look in global aesthetic structure first
      var aesthetics = []
      if (plan.metaData && plan.aestheticStructure && plan.metaData.aestheticStructure[aesthetic]) {
        aesthetics.push(plan.metaData.aestheticStructure[aesthetic])
      }
      // look in local aesthetic next
      _.map(plan.layers,function(l){
        if (l.metaData.aestheticStructure[aesthetic]) {
          aesthetics.push(l.metaData.aestheticStructure[aesthetic])         
        }
      })
      // return the length of the olength of the first aesthetic (or 1 for atomics or objects)
      return _.isObject(aesthetics[1]) ?
        _.keys(aesthetics[1]).length : !_.isUndefined(aesthetics[1])
    }
    
    // adjust figure margins where aesthetics require guides
    subFigure
      .each(function(plan,i){
        var xAxisHeight = 0
        var xClusterAxisHeight = 0
        var legendWidth = 60
        if (hasAesthetic(plan,"X")) {
          xAxisHeight += 25
        }
        if (hasAesthetic(plan,"XCluster")) {
          // 1+length because there's always an outer cluster to select all
          xClusterAxisHeight = (1+hasAesthetic(plan,"XCluster")) * 20
        }
        if (hasAesthetic(plan,"Color") || hasAesthetic(plan,"Fill")) {
          // 1+length because there's always an outer cluster to select all
          legendWidth += 100
        }

        // TODO: enable user to disable showing guides
        
        var s=d3.select(this);
        // calculate the inner sizes.  Should go in d3subfigure since
        // the margins sizes may depend upon data.
        var widgets = plan.data.message.widgets||{}
        widgets.size = widgets.size
        // should move margin calculations out to the containing function
        var dimensions = plan.dimensions
        dimensions.margin = {
          top: (widgets.size=="history")?0:20, 
          right: legendWidth,
          bottom: (widgets.size=="mini")?10:
                  (widgets.size=="history")?25:(xAxisHeight + xClusterAxisHeight),
          xcluster: xClusterAxisHeight,
          left: 60   
        }
  
        dimensions.width = s.attr("width") - dimensions.margin.left - dimensions.margin.right;
        dimensions.height = s.attr("height") - dimensions.margin.top - dimensions.margin.bottom;
        return plan
      })
    
    // build the subFigures
    subFigure.each(function(d,i){
      var plotHandle;
      
      try {
        var subfigureNode=d3.select(this)
        var subfigure=g3.subfigure()
          .setupData(subfigureNode,d,d.dimensions)
          .setupFacets()
          .redrawAxes()
          .redrawGeoms()
        
        d.subfigure = subfigure;
          
      } catch(e){
        e.message="while drawing plot: "+e.message;
        throw(e)
      }

      return d3.select(this); // that's probably not right - only calls should do this.
    })
    
    return subFigure
  }  
  
  // filter is a per-plot (possibly global) filter collection that
  // sends filter messages amongst graphs.  Should rebuild to use
  // d3.dispatch (but what about new graphs - how do they get filters?)
  exports.filter = function() {
    exports.filter.widgets = []
    exports.filter.unfilter = function() {
      exports.filter.widgets &&
      exports.filter.widgets.map(function(x){x.update({})})
    }
    exports.filter.clear = function() {
      exports.filter.widgets = []
    }
    exports.filter.addWidget = function(newWidget) {
      if(newWidget.update)
        exports.filter.widgets.push(newWidget);
    }
    exports.filter.update = _.debounce(function(filterSpec) {
      exports.filter.widgets.map(function(x){x.update(filterSpec)})
    },10)
  }
  
  exports.table = function(dataTableDiv,plan) {
    // create a handle for filtering and selecting table
    var tableHandle = function() {}
    
    // unbundle the plan message
    var structuredData = plan.data.structured,
        dataStructure = plan.data.message.structure,
        graphAesthetic = plan.data.message.grid;
        
    //
    // Manipulating the text table
    //
    
    // Build the default table wrapper   
    tableHandle.update = function updateTable(filterSet) {
      try{
        htmltable.updateTable(dataTableDiv,graphAesthetic,structuredData,dataStructure,filterSet)
      }
      catch(e){ 
        g3widget.showError(dataTableDiv.node().parentNode,'Table update error: '+e.message)        
      }
    }
    
    _.defer(tableHandle.update,{})

    return tableHandle
  }
  
})(typeof exports === 'undefined'? this['g3figure']={}: exports);
