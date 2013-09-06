// g3widget controls whatever sort of content goes in the graph area, 
// plus error handling and result.
// the actually plotting etc is done in g3info.js and g3figure.js

// a widget is the following structure:
// div.g3figure
//   div.message?
//   div.content?
//     div.pane[n]
//       div.plot
//         svg
//         table
//     div.pane[n]
//       

(function(exports){

  exports.showError = function(el,error) {
    messages = d3.select(el)
      .selectAll("div.alert")
      .data([error],_.identity)
    
    messages.enter()
      .append("div")
      .attr("class","alert alert-error")
      .text("Error: " + error)
      .append("button")
      .attr("class","close")
      .attr("data-dismiss","alert")
      .html("&times;")
      
    // am adding no exit code here.
    console.log(error)
    // should really error on pane
    //d3.select(el).selectAll("div.report").transition().style("visibility","hidden");
  }
  
  exports.clearError = function(el) {
    // Note: now we have INFO - error may not be here?
    
    d3.select(el).select("div.content").transition().style("visibility","visible");
    
    // Close all associated errors
    $(el).find(".alert-error").alert('close')
  }
  
})(typeof exports === 'undefined'? this['g3widget']={}: exports);
