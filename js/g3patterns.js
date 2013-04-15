(function(exports){
  
    // build a nice gradient for the hierarchic axis background
  exports.grayGradient = function(plot) {
    
    if(plot.selectAll("defs")[0].length != 0) return;
    
    var gradient = plot.append("defs")
    .append("linearGradient")
      .attr("id", "gradient")
      .attr("x1", "100%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "100%")
      .attr("spreadMethod", "pad");
   
    gradient.append("svg:stop")
      .attr("offset", "0%")
      .attr("stop-color", "silver")
      .attr("stop-opacity", 1);
   
    gradient.append("svg:stop")
      .attr("offset", "100%")
      .attr("stop-color", "#fff")
      .attr("stop-opacity", 1);
  }

})(typeof exports === 'undefined'? this['g3patterns']={}: exports);
