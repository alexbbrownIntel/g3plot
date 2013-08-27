// g3subfigure
// The subfigure is where most of the real work happens.  A subfigure has axes (lots), legend and a body(s)
// The body can be singluar or compound, but always consists of a 2d drawing area into which to place 
// points.
//
// This file uses a d3-like OO structure, unlike the others, because it generates objects - the others are
// really functional, and stored state (but not code) is held in the __data__ object of the relevant nodes.
(function(exports){

  // constructor for subfigure object - a whole graph with axes and legends.
  // once constructed can apply data / filters / zooms and redraw.
  exports.subfigure  = function() {
    // subfigure redraws.
    function subfigure() {
    }
    
    var el, // the element to build this in
        plan, // the plot specification
          // Convenience variables from plan spec
          scaleX, // the x scale type name
        graph,
        dimensions, // useful plot dimensions
          margin,
          width,
          height,
        // master scales
        xScale_master, // the master X scale from ALL the data - really just domain
                       // the actual domain is rewritten in each cellFacet
        xScale_current, // the currently zoomed scale (domain)
        yScale_master, // the master x scale (domain).  note that the local ys are clones
        color, // the color scale
        // transformed versions of the data
        partitionedNodes, // the partitioned node data (at what level?)
        master_layer_index, // the layer which controls faceting, brushing and filtering (only one for now)
        master_layer, // the plan for the master layer
        // some information about the current geoms - for filtering
        yFacetedData, // the faceted data subsets - y (by row, not cell)
        xFacetedData, // facets for x (by column, not cell)
        // some handy selectors
        yFacet, // the y (row) facet selector
        xFacetAxis, // the x (column) facet UI selector (does not contain cellfacets)
        cellFacet, // the cell facet selector
        layerFacet, // the layer facet selector
        dataPointSelector; // how to select all geoms.  This should be easier, layered and multi-geom

    // for each layer, perform any stats which are required.  After this, the layers
    // are combined into a single array.  Current stats are just barStack.
    subfigure.doLayerStats=function(layer){
           
      // expects scaleX, width, margin etc to be already set-up by caller
           
      // unbundle the plot message
      var aesthetic = layer.data.message.aesthetic
      var position = layer.data.message.position
      var aesData = layer.data.aesthetic
      var aesStructure = layer.metaData.aestheticStructure
    
      // Do calculation for stacked bars.  Not sure how this gets called.
      if(position && position.x == "stack") { // is this X?
        g3stats.barStack(aesData, "Fill")  
      } else {
        if (!_.isUndefined(aesthetic.XCluster)) {
          _.each(aesData,function(d){
            d.y=d.Y // y is simply Y
            d.y0=0 // so that bars can be drawn from unstacked data,
        }) } else {
          _.each(aesData,function(d){
            d.y=d.Y // y is simply Y
            d.y0=0 // so that bars can be drawn from unstacked data,
            d.x=d.X
        })
        }
      }
      
      // TODO: here we can also assign static color mappings for each 
      // layer (doesn't have an entry in the layer yet)
      
      // TODO: here we can allow x and y transforms such as *10 or *2.5 to allow
      // unlike quantities to be appropriately scales for parallel representation
      // (yes I know it's a poor idea but it's often requested)
      
      return(aesData)
    }
 
    subfigure.setupData=function(subfigureElement, _plan, newDimensions){
      
      // note: these are not writing to locals!
      el = subfigureElement
      plan = _plan
      dimensions=newDimensions
      margin=dimensions.margin
      width=dimensions.width
      height=dimensions.height
      
      subfigure.dispatch = d3.dispatch("click")
      
      if (plan.error != undefined) throw({message:"renderPlot error:" + plan.error})
      
      // unbundle the plot message
      graph = plan.data.message
      
      // don't choose colorfield yet since it's layer dependent and HAS the SAME SCALE (probably)
      
      // extract data from all layers
      var aesData = d3.merge(_.pluck(_.pluck(plan.layers,"data"),"aesthetic"))
      
      // hang on to the master layer for filtering, clustering etc.
      master_layer_index = 0
      master_layer = plan.layers[master_layer_index]
      
      // Setup axes
      
      // xCluster Axis.  this one is special because the structure MUST exist and be the same
      // for all layers.  This is not validated right now
      // TODO: validate xCluster equivalence
      // in the future we may allow one layer to apply to all clusters, but it's not clear
      // right now how that might be implemented.
      if (aestheticUtils.hasAesthetic(plan,"XCluster")) {
        // Build the data struture for the hierarchical x-scale/X-axis.
        // It would be nice if this were a real d3 axis type, but that would require
        // nested heterogenous axis with variable size rangebands.  Not possible today
        partitionedNodes = g3xcluster.hierarchX(aesData,graph.layers[master_layer_index].aesthetic.XCluster, 
                                                master_layer.metaData.aestheticStructure.XCluster, width, margin.xcluster)
      } else {
        // do it anyway, with no data, for uniformity   
        partitionedNodes = g3xcluster.hierarchX(aesData,"IGNORE THIS MESSAGE", {}, width, margin.xcluster)
      }
      
      var postTransformLayers = _.map(plan.layers,subfigure.doLayerStats)
      
      // Calculate the subset of axes/data for each y-facet (vertical 'small multiple')
      yFacetedData = g3figureDataUtils.facetData(aesData,"YFacet","Y");
      // Calculate the X subfacets (aka cellFacets) of each Y facet
      _.forEach(yFacetedData,function(yFacet){
        yFacet.cellFacets = g3figureDataUtils.facetData(yFacet.values,"XCluster","X");
        // calculate the Layers in each cellFacet
        _.forEach(yFacet.cellFacets,function(cellFacet){
          cellFacet.layerFacets = d3.nest().key(function(d) {
            return d.layer.name; // TODO: check that all layers HAVE a name and are unique. 
            })
          .entries(cellFacet.values)
        })
      })

      
      // also split global dataset x, in order to calculate facet scales - per column
      xFacetedData = g3figureDataUtils.facetData(aesData,"XCluster","X")
    
      // calculate unzoomed domains
      // note that this domain calculation ignores any use of x0 or dx and might not get
      // scales right for objects with those.
      var xData = _.pluck(aesData,"X").concat(g3functional.pluralise(graph.extents && graph.extents.x))
      if (aestheticUtils.hasAesthetic(plan,"DX"))
        xData = xData.concat(aesData.map(function(d){return +d.DX?+d.X+d.DX:+d.X})) // assume right extend DX
  
      var numerise = function(x){return _.map(x,function(x){return +x})}
            
            // work out what the scales are
      // TODO: this should be well known from defaults set up way earlier
      
      // Global scales for x, y, color
      scaleX = 
        (graph.scales && graph.scales.x && graph.scales.x) ? graph.scales.x : "linear"
      if (!aestheticUtils.hasAesthetic(plan,"X")) {
        scaleX = "unit"
      }
      
      scaleY = 
        graph.scales && graph.scales.y || "linear"
      
      var scaleColor = 
        graph.scales && graph.scales.Color || "ordinal"
           
      switch(scaleX) {
        case "ordinal":
          xScale_master = d3.scale.ordinal()
            .domain(xData); // could use pluck here
          break;
        case "date":
          xScale_master = d3.time.scale()
            .domain(g3math.grow2(1.05,d3.extent(numerise(xData))))
          break;
        case "linear":
          xScale_master = d3.scale.linear()
            .domain(g3math.grow2(1.05,d3.extent(numerise(xData))))
          break;
        case "unit":
          xScale_master = d3.scale.ordinal()
            .domain(1) // need to update this later.
          break;
        default:
          throw("Unknown x scale type: \""+scaleX+"\"");
          break;
      }
      
      
      // all the y's share a DOMAIN at the moment - 
      // so build it here, once
      switch(scaleY) {
        case "log":
          yScale_master = d3.scale.log()
            // extent is over ALL data here - is that appropriate? not always.
            .domain(d3.extent(aesData, function(d) { return d.Y; }))
          break;
        case "linear":
          yScale_master = d3.scale.linear()
          
          if (plan.data.message.extents && !_.isUndefined(plan.data.message.extents.y)) {
            if (!_.isArray(plan.data.message.extents.y))
              plan.data.message.extents.y = [plan.data.message.extents.y]
            yScale_master.domain(d3.extent(aesData.concat(_.map(plan.data.message.extents.y,function(y){return {y:y}})), 
              function(d) { return ((d.y0+d.y)||d.y); })).nice();
          } else {
             // temporarily suppress 0 inclusion
            yScale_master.domain(d3.extent(aesData, function(d) { return ((d.y0+d.y)||d.y); })).nice();
          }
          break;
        default:
          throw("Unknown x scale type: \""+scaleX+"\"");
          break;
      }
      
      switch(scaleColor) {
        case "ordinal":
          color = d3.scale.category20();
          // Inject alpha sorted fields into color right now,
          // to prevent color jitter when 'animating' between
          // two sims for the same data.  Could be better.
        //  if (colorField=
        //      _.chain(aesStructure)
        //        .keys()
        //        .intersection(["Color","Fill"])
        //        .first().value())
          if (aestheticUtils.hasAesthetic(plan,"Color"))
          {
            if (plan.data.message.extents && plan.data.message.extents.Color) {
              color.domain(plan.data.message.extents.Color)
            } else {
              color.domain(_.unique(_.pluck(aesData,"Color")).sort())
            }
          }
          break;
        case "linear":
          color = d3.scale.log()
            .domain(d3.extent(aesData, function(d) { return +d.Color }))
            .range(["red","yellow"]);
          break;
        default:
          color = null;
      }

      xScale_current = xScale_master.copy()

      return subfigure
    }

    // setup the facets and build the nodes for the axes.  Need only be called once per new message - 
    // unless the facet layout will change
    subfigure.setupFacets = function(){

      //
      // The document
      //
      // relies on a small amount of skeleton being already created.  should fix.
                      
      // initialise values in the plot and obtain the graph root
      var root = el
          .attr("transform", "translate(" + margin.left + "," + (dimensions.top + margin.top) + ")");
      
      var plotNode=root.select("g.plot")
      

      
      // configure each x cluster, adding x-scales and axes
      // unlike y, each X can have a separate scale
      // should consider making these d3 things if they aren't.
      _.map(xFacetedData,function(facet,i,allFacets){
  
        var countFacets = allFacets.length
        
        var x = xScale_current.copy()
        
        // assume the facets contain something at all
        aValue = facet.values[0]
        if (_.isUndefined(aValue)) throw({message:"X Cluster Facet contains no values"}) // not really a bug but for now it is.
  
        // set the output range of the scale to the width of the facet.
        // also selects if rangeBands are used.
        switch(scaleX) {
          case "unit": x.domain([aValue.parent.x]); /* fallthrough */
          case "ordinal": { 
            // possible options here allow domain to be adjusted per x facet 
            // this code is a clone of code above in ordinal
            var xData = _.pluck(facet.values,"X").concat(g3functional.pluralise(graph.extents && graph.extents.x))
            if (aestheticUtils.hasAesthetic(plan,"DX"))
              xData = xData.concat(facet.values.map(function(d){return +d.DX?+d.X+d.DX:+d.X})) // assume right extend DX
                        
            x.domain(xData)
            
            x.rangeBands([0,aValue.parent.dx]); 
            break;
          }
          default: x.range([0,aValue.parent.dx]); break;
        }
        
        var xAxis = d3.svg.axis()
          .scale(x)
          //.tickFormat(d3.format(".2s"))
          .orient("bottom")
        
        // ordinal scales get messy with many. arbitrarily limit to 10.
        // see code in redrawaxes too
        if(scaleX == "ordinal") {
          if (Math.abs(g3math.diff(x.rangeExtent())) < 150)
            xAxis.ticks(Math.floor(g3math.diff(x.rangeExtent())/30))
        } else {
          var extent = Math.abs(g3math.diff(xAxis.scale().range()))
          var PixelsPerTick = scaleX=="date"?100:30
          xAxis.ticks(Math.min(extent/PixelsPerTick,10))
        }
     
        
        facet.xScale = x
        facet.xAxis = xAxis // this is a little wrong - it means a single axis is 
                            // actually shared between the facets, which could lead to errors.
        facet.xExtent = d3.extent((x.rangeExtent||x.range)())
        facet.x = aValue.parent.x // position of LHS of facet - used for overflow/clip code
        // may attach a g here as well.
      })
      
      // configure each y facet, adding y-scales and axes
      // also do x-faceting to build cellfacets.
      _.map(yFacetedData,function(facet,i,allFacets){
  
        var countFacets = allFacets.length
        
        var facetMargin = (graph.dimensions.facetMargin && !_.isUndefined(graph.dimensions.facetMargin.y)) ?
				  graph.dimensions.facetMargin.y : 20
        
        var y = yScale_master.copy()
        
        y.range([(countFacets-i)*(height+facetMargin)/countFacets-facetMargin,
                (countFacets-1-i)*(height+facetMargin)/countFacets])
        
        var yAxis = d3.svg.axis()
          .scale(y)
          .tickFormat(d3.format(".2s"))
          .orient("left");
            
        if (graph.widgets && graph.widgets.yticks!="auto") {
          yAxis.ticks(graph.widgets.yticks)
        }
        facet.yScale = y
        facet.yAxis = yAxis
        // may attach a g here as well.
        
        // Calculate the data for just this xFacet.  Note this is different
        // from xFacetedData which is for the whole 'column'.
        // TODO: should this split happen much earlier?
//        facet.cellFacets = g3figureDataUtils.facetData(facet.values,"XCluster","X");
        
        // need to copy the master X facet data here for scales & friends
        var facetKeys = _.pluck(facet.cellFacets,"key")
        if(facetKeys.length != facet.cellFacets.length) throw({message:"Internal g3 error - not enough cell / x facet keys"})
        
        // hash let's us grab an array element by key
        var hash=function(array,key){var newHash={}; array.map(function(el){newHash[el[key]]=el}); return newHash;}
        
        var masterFacetHash=hash(xFacetedData,"key")
        localFacetHash=hash(facet.cellFacets,"key")
        facetKeys.map(function(key){
          // Copy the master X facet properties into the local cellFacet.  There is a local cellFacet per yfacet!
          localFacetHash[key].yScale=y
          localFacetHash[key].xScale=masterFacetHash[key].xScale
          localFacetHash[key].xAxis=masterFacetHash[key].xAxis // there's too many axes here.
          localFacetHash[key].xExtent=masterFacetHash[key].xExtent
          localFacetHash[key].x=masterFacetHash[key].x
        })
        
      })
      
      // build g's for the facets.  yFacet is a class property
      yFacet = plotNode.selectAll("g.facet").data(yFacetedData,function(d){
        return yFacetedData.length>1?d.key:"facet"
      })
      
      var newYFacet = yFacet
        .enter()
        .append("g").attr("class","facet")
        .each(function(){ 
          var s = d3.select(this)
          s // first append the yaxis components     
            .append("g").attr("class","yaxis axis")
            .append("text")
          return s
        })     
      
      yFacet.exit().remove()
      
      // build g's for the xFacets (xfacetaxis)
      if (scaleX != "unit") 
      {
        var xaxisNode = root.select(".xaxis")
            
        xFacetAxis = 
          xaxisNode
            .selectAll(".xfacetaxis")
            .data(xFacetedData,function(d){return d.key})
          
        xFacetAxis.enter()
          .append("g").attr("class","xfacetaxis")
          .each(function(d,i){
            var s = d3.select(this)
            s.append("rect").classed("zoom_layer",true)
            s.append("g").classed("xaxis axis",true)
             .append("text").attr("class","guidelabel")
          })
          
        xFacetAxis.exit().remove()
      } 
      
      var cellFacetSVG = true,
          cellFacetElem = cellFacetSVG?"svg":"g"
      
      // build cell facets - intersection of x/y faceting
      // note: not a VAR because we save it.
      cellFacet = yFacet
        .selectAll(cellFacetElem+".cell_facet")
        .each(function(d,i){ this.__data_old__ = d}) // save OLD scale for animation purposes
        .data(function(d){
        return d.cellFacets
      },function(d){
        return d.key
      })
      
      // (re)build layers
      
      
      
      var positionCellFacet = function(cellFacet) {
        if (cellFacetSVG) {
          // SVG has the advantage that it's clipped (non overflow) - good for
          // graphics engine controlled zooming.
          // note that clipping works okay with linear scales but
          // poorly with ordinal scales at the moment, and not taking
          // account of rangeband or DX means right or left hand values
          // can be incorrectly clipped.
          // style clip could be AUTO - setting it to something else 
          // There ARE clip/overflow bugs, espcially with rangebands
          // and ordinal points that are positioned poorly
          cellFacet
            .attr("width",function(d){return d.xExtent[1]-d.xExtent[0]})
            .attr("x",function(d){return d.x})
            .attr("y",0)
            .attr("height",1000)
            //.append("svg")
           // .append("rect").attr("class","svgbg").style("fill","#FFF")
            //.attr("y",function(d){return this.parentNode.__data__.yScale.range()[0]})
            //.attr("height",function(d){return this.parentNode.__data__.yScale.range()[1]-this.parentNode.__data__.yScale.range()[0]})
            .style("background-color","#f11")
            //.style("overflow","visible") // useful while debugging.  
        } else {
          // G is not clipped (overflow) and needs 'transform' not 'x'
          // to change it's content coordinate space
          cellFacet
            .attr("transform", function(d){return "translate("+d.x+",0)"})
        }
        return cellFacet
      }
      
      var zoomAdjust=(function(){
        var zoomextent = graph.extents&&graph.extents.zoom||[1,5],
            zoom, node; 
        var zoomAdjust=function(_event){
          node=this
          zoom=_event.target
          return zoomAdjust
        }
        zoomAdjust.adjust = _.throttle(function(){
          var adjusted = false;
          if (zoom.scale() <= zoomextent[0]) {
            adjusted = true;
            zoom.scale(1); 
            //zoom.translate([0,0]);
          }
          console.log(zoom.translate()[0])
          if (zoom.translate()[0] < -(zoom.scale()-1)*node.getAttribute("width")) {
            adjusted = true;
            zoom.translate([-(zoom.scale()-1)*node.getAttribute("width"),0])
          } else if (zoom.translate()[0] > 0) {
            adjusted = true;
            zoom.translate([0,0])
          }
          if (adjusted)
            subfigure
              .redrawAxes()
              .redrawGeoms()
              
            xFacetAxis
              .each(function(d,i){
                d.brush.rebrush() // reposition and redraw the brushes
              
          })
        })
        
        return zoomAdjust
      })()
      
      var zoomFacet=function(d,i){
        // there should be a d3.event but since zoomfacet is throttled there
        // sometimes isn't.
        if (!d3.event) return;

        var newscale = d3.event.scale
        var newtranslate = d3.event.translate
        if (newscale == 1 && Math.max(newtranslate.map(Math.abs)) < 2)
          return;
        
        // should fastZoom to allow touch events to be super responsive
        // dblclick is only one case where this isn't true - mousewheel
        // also should have slow version, and any programmatic zoom trigger 
        // should use slow.
        var fastZoom = d3.event.sourceEvent.type!="dblclick"

//        optional : clear on zoom
//        subfigure
//          .brush.brush.clear()
//        should clear the filters too, but doesn't.
          
        subfigure
          .redrawAxes(fastZoom)
          .redrawGeoms(fastZoom)
          
        xFacetAxis
          .each(function(d,i){
            d.brush.rebrush() // reposition and redraw the brushes
          })
                          
        var endZoom = d3.event.sourceEvent.type=="mouseup"
                   || d3.event.sourceEvent.type=="mousewheel"
        
        
      
        if (d3.event.sourceEvent.type=="mousewheel") {
          // this case is bad for touch based zooming - it starts to shrink it while the user is still 
          var isTouch = false
          if (isTouch)
            d3.select(window).on("mousemove.zoomadjust",_.once(zoomAdjust.call(this,d3.event).adjust))
          else
            _.defer(zoomAdjust.call(this,d3.event).adjust) // I should make new ones eat older ones.  
        }
        
        if (d3.event.sourceEvent.type=="mousemove") {
          d3.select(window).on("mouseup.zoomadjust",_.once(zoomAdjust.call(this,d3.event).adjust))
        }
        
      }
      
      var newCellFacet = cellFacet
        .enter()
        .append(cellFacetElem)
        .attr("class","cell_facet")
        .call(positionCellFacet)
        // now create a rect background to the facet to catch events

      //
      // Zoom
      //
        
      cellFacet
        .transition()
        .call(positionCellFacet)
         
      // (re)build layers - each cellFacet has multiple drawing layers
      // with indepdendent data, aesthetics and geoms.
      // note: not a VAR because we save it.
      layerFacet = cellFacet
        .selectAll("g.layer_facet")
        .data(function(d){
          return d.layerFacets
        },function(d){
          return d.key
        })
        
      var newLayerFacet = layerFacet
        .enter()
        .append("g")
        .attr("class",function(d){
          return("layer_facet")
          //return(["layer_facet","layer_name_"+d.key]) // Remove this for now, it breaks "exit"
        })
      
      if (graph.onZoom) {
        xFacetAxis
          .select(".zoom_layer")
          .each(function(d,i) {
            var zoom = d3.behavior
              .zoom()
              .x(d.xScale)
              .scaleExtent(g3math.grow2(1.05,graph.extents&&graph.extents.zoom?graph.extents.zoom:[1,5]))
              .on("zoom",_.throttle(zoomFacet,10)) // throttling may mean that the event no longer exists
            d3.select(this)
              .call(zoom)
          })
      }
      
      //
      // brushes
      //

      // brushes allow parts of the graph to be focused on.
      // note that brushes don't currently survive a redraw, and should.
      if (xFacetedData.length > 0 && graph.onBrush){
            
        xFacetAxis
          .each(function(d,i){
            // A brush attaches to an axis, but we have multiple x-axes, so
            // what do we do?  It has lots of arguments because it was refactored
            // should fix.
            d.brush =
              g3brush.brush(d3.select(this), graph, 
                            master_layer.metaData.aestheticStructure, 
                            master_layer.data.aesthetic, // should we really supply all the data? or just the facet's?
                            d.xScale,
                            height, 
                            scaleX)   
                            
            // route clicks which brush doesn't want here and publish.
            // not sure if that helps anyone
            d.brush.dispatch.on("click",subfigure.dispatch.click)
          })

      } else {// end of brush
        // kill the brush
        delete subfigure.brush
        root.selectAll(".brush").remove();
      }
      
      // note that cellfacets don't get axes - those are handled
      // only once per vertical , in the master xaxis object
      
      // Layers
      layerFacet
        .exit()
        .remove() // perhaps a little aggressive  
        
      cellFacet
        .exit()
        .transition()
        .style("opacity",0.0)
        .remove()
      
      return subfigure
    }
    
    subfigure.setupLayers = function(){}
    
    // redrawAxes draws the axes and legends.  It should be called
    // at least once before redrawGeoms is called. (old comment)
    subfigure.redrawAxes = function redrawAxes(fast) 
    {
      var root = el

      
      // draw the XCluster axis
      // note deep clusters or XCluster + X axis can be visually ugly sometimes.
      if (aestheticUtils.hasAesthetic(plan,"XCluster")) 
      {
        var clickEvent = 
          graph.onClick && graph.onClick.XCluster &&
          g3events.updateShinyInputFromHierFn(graph.onClick.XCluster.input,
                                              plan.layers[0].metaData.aestheticStructure["XCluster"])
          
        g3xcluster.hierAxis(root,partitionedNodes,height+margin.bottom-margin.xcluster,width,margin.xcluster,clickEvent,graph.format&&graph.format.XCluster)
      }
    
      if (scaleX != "unit") 
      {
        
        var xAxisNode = xFacetAxis.select(".xaxis")
   
        // clean up other axis trash
        // this is inappropriate now because 1) names should mean we don't
        // reuse plots with the same background and 2) both can exist
        // 3) it's not held in this object (probably)

        // enter was already done above
        xFacetAxis
          //.attr("transform", function(d){return "translate(0," + height + ")"})
           .attr("transform", function(d){return "translate("+d.x+",0)"}) 

        xAxisNode
          .attr("transform", "translate(0," + height + ")")
          .select("text").filter(function(d,i){return i==0})
            .attr("x", width)
            .attr("y", -6)
            .style("text-anchor", "end")
            .text( graph.labels.x );
          
         xAxisNode
          .each(function(d,i){
            var s=d3.select(this)
            var xAxis = d.xAxis
            var xScale = xAxis.scale()
            
            if (scaleX=="ordinal") {
              
             // if (xScale.domain().length > 15)   {
              //  xAxis.tickValues([]);
            //  }
              if (xScale.domain().length > 1 && Math.abs(g3math.diff(xScale.rangeExtent()))/xScale.domain().length  < 50)
              {
                xAxis.tickValues([]);
              } 
              //if (scaleX=="ordinal" && Math.abs(g3math.diff(xScale.rangeExtent())) < 150) {
              //  xAxis.ticks(Math.floor(g3math.diff(xScale.rangeExtent())/30))
              //}
              
              graph.format
               && graph.format.X 
               && xAxis.tickFormat(function(x){
                 return x.replace(new RegExp(graph.format.X[0]),graph.format.X[1])
                 
              })
            }
            
            
            if (fast)
              s.call(d.xAxis)
            else
              s
                .transition()
                .call(d.xAxis)

            return s;
          }) 
          
        // While events are not collected directly from the zoom layer, it does somehow
        // route clicks neatly to where we want them, and allows panning in the margin
        // and zooming in the body.  (also panning in the body if brushing is off)
        xFacetAxis
          .attr("width",function(d){return d.xExtent[1]-d.xExtent[0]})
          .select(".zoom_layer")
          .style("fill","#000").style("opacity","0.0")
          .attr("width",function(d){return d.xExtent[1]-d.xExtent[0]})
          .attr("x",function(d){return d.x})
          .attr("y",function(d){return 0})
          // extend the zoom/pan region into the axis, since brush steals panning in the graph area (but not zoom)
          .attr("height",height + dimensions.margin.bottom)
      } 
      
      // finish configuring the y axes
      yFacet
        .select("g.yaxis")
        .transition()
        .each(function(d,i){
          var s=d3.select(this)
          // rangeExtent is currently a proxy for 'ordinal'?
          if (!d.yAxis.scale().rangeExtent) {
            // try to limit the number of y ticks
            var extent = Math.abs(g3math.diff(d.yAxis.scale().range()))
            var PixelsPerTick = 20
            d.yAxis.ticks(Math.min(extent/PixelsPerTick,10))
          }
          d.yAxis(s)
          return s;
        })
        
        // combined y and yfacet label.
        .select("text")
          .each(function(d,i){
            var s=d3.select(this)
            var orientation = "horizontal"
            switch(orientation) {
              case "vertical":
                s
                  .attr("transform", "rotate(-90)") // this changes x and y
  
                  .attr("x", function(d){return -d.yScale.range()[1]})
                  .attr("y", 6) // or x for vertical
                  .style("text-anchor", "end")
                  .attr("dy", ".71em")
                break;
              case "horizontal":
                s
                  .attr("y", function(d){return d.yScale.range()[1]})
                  .attr("x", 6) // or x for vertical
                  .style("text-anchor", "start")
                break;
            }
            return s;
          })
  
          .text( function(d){
 						// handle yfacet type for date

						scaleYFacet = 
							(graph.scales && graph.scales.yfacet) ? graph.scales.yfacet : "linear"

						scaleYFacetFormat = 
						  (graph.format && graph.format.yfacet) ? d3.time.format(graph.format.yfacet) : d3.time.format.iso

					  return graph.labels.y + (("undefined"==d.key)?""
						  : (" "+( scaleYFacet=="date" 
							         ? scaleYFacetFormat(new Date(+d.key))
											 : d.key )));
          } )
        
      // draw a legend if we have used any colors
      if (aestheticUtils.hasAesthetic(plan,"Color")) {
        // TODO: allow filtering to read from any layer
        var aesStructure = master_layer.metaData.aestheticStructure
        // TODO: fixme - get labels from all layers, collapse compound structure ids.
        var label = graph.labels && graph.labels.Color || aesStructure.Color
        var legendPos = {x:width+5,y:0};
        var clickEvent = graph.onClick && graph.onClick.Color &&
          function(d){g3figure.filter.update(d?_.object([aesStructure.Color],
                                     [function(x){
                                       return x==d
                                     }]):{})}
        clickEvent = clickEvent || function(x){return false}
        g3legends.discrete_color(root,color,legendPos,label,
          clickEvent,height,
          graph.position && graph.position.x == "stack" // invert color legend if stacked
          )
      } else {
        root.selectAll(".legend .key").data([]).exit().remove()
      }
      
      return subfigure;
    }

    // redraw the currently displayed set of geoms.
    // fast indicates that the fast geom functions should be used that
    // do no transitions, joins, enters or exits and update only critical attributes
    // Note that geoms are per layer.  this means the geom key is false now - since multiple
    // layers could use identical geoms
    subfigure.redrawGeoms = function(fast) {
      
      layerFacet
        .each(function(d,i){
        
        var layerFacet = d3.select(this)
        
        if (d.values.length == 0) return; // TODO: fix this so the layer name is in the layerfacet (or a link)
        // otherwise length 0 geoms cannot delete themselves (but maybe they don't exist)
        
        var geoms = d.values[0].layer.geom
        var aesthetic = d.values[0].layer.aesthetic

        _.map(geoms, function(geom) {
          switch(geom) {
  
          case "voronoi":
            layerFacet
              .each(function(d,i){
                // note that for linear/linear plots voronoi points could be scaled later - 
                // at the point of drawing, which would save multiple calculations.  However
                // the same is not true of ordinal, since it's not clear that arbitrary 
                // ordinal values are real.
                g3stats.voronoi(d.values,this.parentNode.__data__.xScale,this.parentNode.__data__.yScale)
              })
            
  
          case "point":
          case "point_bar":
          case "bar":
          case "range_bar":
          case "point_range_bar":
  
    
            var clickEvent;
            if (graph.onBrush && graph.onBrush.x &&
                graph.onBrush.x.drag && graph.onBrush.x.drag.input) {
                    
              var clickEventInner = 
                g3events.updateShinyInputFromGeomFn(graph.onBrush.x.drag.input,
                aesthetic.XFilterKey?"XFilterKey":"X")
            
              clickEvent = function(e) { 
                clickEventInner(d3.event.target.__data__)
                d3.event.stopPropagation(); //? no idea what this does
              };
            }
            if (graph.onClick && graph.onClick.x &&
                graph.onClick.x.input) {
                    
              var clickEventInner = 
                g3events.updateShinyInputFromGeomFn(graph.onClick.x.input,
                  aesthetic.XFilterKey?"XFilterKey":"X")
            
              clickEvent = function(e) { 
                clickEventInner(d3.event.target.__data__)
                d3.event.stopPropagation(); //? no idea what this does
              };
            }

          case "area": // different way to send values
            if(!fast)
              dataPointSelector = g3geoms[geom](layerFacet,function(d){return d3.nest().key(function(d){return d.Color}).entries(d.values)},color,clickEvent)
                .draw(layerFacet)
            else
              g3geoms[geom](layerFacet,function(d){return [d.values]},color,clickEvent)
                .fast_redraw(layerFacet)
              
            if(!fast)
              dataPointSelector = g3geoms[geom](layerFacet,function(d){return d.values},color,clickEvent)
                .draw(layerFacet)
            else
              g3geoms[geom](layerFacet,function(d){return d.values},color,clickEvent)
                .fast_redraw(layerFacet)
              
            break;

          case "line": // different way to send values
            if(!fast)
              dataPointSelector = g3geoms[geom](layerFacet,function(d){
                return _.map(d3.nest().key(function(d) {
                                        return d.Color
                                    }).entries(d.values),function(c) {
                                        c.Color = c.key; return c;
                                    })},color,clickEvent)
                .draw(layerFacet)
            else
              g3geoms[geom](layerFacet,function(d){return [d.values]},color,clickEvent)
                .fast_redraw(layerFacet)
              
            break;

          default:
            throw({message:"Unknown geom=\""+geom+"\" in plot specification for layer XXX"})  
        }
        })

        })

      return subfigure
    }

    subfigure.filterHandle = function() {
      
      // this is NONSENSE now.
      // Need to destroy this and make this a subfigure function.
      // Return a handle to update this plot for filtering etc.
      var plotHandle = (function() {
          plotHandle = function() {} 
          return plotHandle
        })()
      
      // Return a handle to update this plot for filtering etc.
      plotHandle.update = function(filterSpec) {        
            var filterFn=aestheticUtils.filterFromFilterSpec(filterSpec,master_layer.metaData.aestheticStructure)
            // TODO: dataPointSelector is not appropriate when multiple layers and geoms exist.  Fix somehow to use
            el.select("g.plot").selectAll(dataPointSelector)
            .style("opacity",function(d) { return filterFn(d)?1.0:0.2})
      }
      
      return plotHandle
    }


    return subfigure
  }
  
// selfishly, this file makes the only g3 object.  I need to place this logic elsewhere.
})(typeof exports === 'undefined'? this['g3']={}: exports);
