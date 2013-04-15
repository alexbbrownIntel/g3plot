// g3brush handles construction and operation of the brushes, and links events.
//
// Note that there is only ONE brush (per subplot) at the moment.  Brush per
// facet or cluster is not yet supported.
// 
(function(exports){

  // Could use http://raphaeljs.com/icons/#opensource but for now
  // let's have a boring triangle icon:
  var filterFunnelIcon = d3.svg.symbol().type("triangle-down").size("130")

  // create or re-use a brush.  Takes a lot of arguments right now - 
  // should probably just take the parent node, and the aesStructure,
  // and maybe some filterkey information.
  exports.brush = function(subplotEl, graph, aesStructure, aesData, scales, height /* yuck */, scaleX) {
    // Install events to respond to brush updates.
    var dragAction,
        funnelClickAction,
        clickAction,
        dispatch = d3.dispatch("click");
  
    // dragaction always updates as you edit the brush.  
    if (graph.onBrush && graph.onBrush.x && graph.onBrush.x.drag) {
        if (graph.onBrush.x.drag.input)
        // I add a throttle here
        // to improve interactivity.  May be able to go less than 500.
          dragAction = 
            g3events.updateShinyInputFromBrushFn(graph.onBrush.x.drag, 500, aesStructure, aesData, scaleX);
        else if (graph.onBrush.x.drag.filter)
          dragAction =
            g3events.updateFilterFromBrushFn(aesStructure, aesData, scaleX);
    }
    
    // funnelClickAction is what happens when you click the apply (funnel) icon
    if (graph.onBrush && graph.onBrush.x && graph.onBrush.x.apply) {
        funnelClickAction = 
          g3events.updateShinyInputFromBrushFn(graph.onBrush.x.apply, 500, aesStructure, aesData, scaleX);
    }
    
    // clickAction is what happens when you click the background and a brush is not present
    if (true /* always does this for the moment */) {
      // on a background click it should zoom to large enough that the individual points
      // are large enough to click.  If that's already the case, zoom back out.
      clickAction = dispatch.click
      //http://mbostock.github.com/d3/talk/20111018/#15
    }
        
    var brushChanged = false;
        
    // What do do in response to a brushing - usually sets g3 filters or shiny inputs
    var brushed = function brushed() {
      var brush = d3.event.target;
  
      // check if the brush is not empty.  valueOf required to make js Date objects work
      if (brush.extent()[1].valueOf()!=brush.extent()[0].valueOf()) {   
        brushChanged = true;
        dragAction(brush)
  
      } else { // the brush is empty
        // should throttle this
        g3figure.filter.update({})
      }
    }
    
    var brushends = function brushends() {
      var brush = d3.event.target;
  
      // check if the brush is not empty
      if (brush.extent()[1].valueOf()!=brush.extent()[0].valueOf()) {   
        dragAction && dragAction(brush)
  
      } else { // the brush is empty
        // should throttle this
        g3figure.filter.update({})
        
        if (!brushChanged) {
          var xClick = brush.extent()[0]
          clickAction(brush,xClick)
        }
      }
      
      brushChanged = false;
    }
    
    var brushstarts = function brushstarts() {
      var brush = d3.event.target;
  
      // check if the brush is not empty
      if (brush.extent()[1].valueOf()!=brush.extent()[0].valueOf()) {   
        brushChanged = true;
        dragAction(brush)
  
      } else { // the brush is empty
        // should throttle this
        g3figure.filter.update({})
      }
    }
    
    var brush = d3.svg.brush()
      .x(scales) // doesn't actually support multiple right now
      .clear() // reset each time we build it
      .on("brush", brushed)
      .on("brushend", brushends)
      .on("brushstart", brushstarts)
    
  
    var brushNode = subplotEl.selectAll("g.brush").data([1])
    brushNode.enter().append("g").attr("class","brush")
    
    brushNode.brush = brush
    brushNode.brush = brush;
    brushNode.dispatch = dispatch


    brushNode.rebrush = function() {
    
      // after zoom this is useful:
      brush.extent(brush.extent())
    
      brushNode
        .call(brush)
        .selectAll("rect")
   //       .attr("y", -6)
          .attr("height", height);
          
      
      if (graph.onBrush && graph.onBrush.x && graph.onBrush.x.apply) {
        // add a button to request a server side filter
        brushNode.select(".resize.w")
          .append("path")
          .attr("d",filterFunnelIcon)
          .style("fill",d3.rgb("grey"))
          .style("stroke","none")
          .style("cursor","pointer")
          .style("pointer-events","all")
          .on("click",function(d) { funnelClickAction(brush) })
          .each(function(d){
            $(this).tooltip({
              title:"Search for these workloads",
              placement:"top",
              container:"body"
            })
          })
          .on("mouseover", function(d, i) {
            d3.select(this)
              .style('fill', d3.rgb(31, 120, 180));
           })
           .on("mouseout", function(d, i) {
             d3.select(this)
               .style("fill", d3.rgb("grey"));
          });
      }
    }
    
    brushNode.rebrush()
    
    // register to receive events from linked inputs
    // and update the visible brush extents from their user-edited data.
    // mainly cosmetic.
    if(graph.onBrush && graph.onBrush.x && graph.onBrush.x.drag && graph.onBrush.x.drag.input) {
      var simIdFields = 
        graph.onBrush.x.drag.input.join(", ")
      $(".simInfo")
        .on("keyup.g3brush brushChange",simIdFields,function updateBrushFromInputs(event)
        {
          // This value is FilterKey - but the brush is on a different axis - must
          // convert back somehow.  This direction is more complex since we don't
          // have the object
          var filterField = aesStructure.XFilterKey?"XFilterKey":"X"

          newExtent = _($(simIdFields))
              .chain()
              .pluck("value") // the field value
              .map(function findXFromXFilterKeyForBrush(inputValue)
              {               // search all the data (:-()
                return aesData.filter(function(x){
                  return x[[filterField]]==inputValue
                })[0]
              })
              .map(function(d){return d?d.X:d}) // grab it's x value - to tell the brush
              .value()

          newExtent[0] = newExtent[0] || newExtent[1]
          newExtent[1] = newExtent[1] || newExtent[0]

          // updating extents appears to automatically redraw here
          brushNode.call(brush.extent(newExtent))
        }
      )
    }
    
    return brushNode
  }
      
})(typeof exports === 'undefined'? this['g3brush']={}: exports);
