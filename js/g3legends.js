(function(exports){
  // draw the color legend  
  exports.discrete_color = function discrete_color(plot, colorScale, legendPos, label, event, height,invert) {
   
    var legend = plot.select(".legend")
      .attr("transform", "translate(" + legendPos.x + ",0)");

    legend.select("text.guidelabel").data([null])
      .attr("y",-10)
      .text("⊂ "+label)
      .on("click",event)

    // reversing the legend order is great for stacked bars, but
    // less good otherwise
    var leg_keys = legend.selectAll("g.key")
      .data(
        invert?colorScale.domain().slice(0).reverse():colorScale.domain(),
        _.identity)
     
    var spacing = Math.floor(Math.min(20,(height-legendPos.y)/colorScale.domain().length))
     
    var newkeys=leg_keys
      .enter().append("g").each(function() {
        var s = d3.select(this)
        s.append("rect")
        s.append("text")
      })
      
    leg_keys
      .attr("class", "key")  
      .attr("transform", function(d, i) { return "translate(0," + i * spacing + ")"; })
      .on("click", event)        
      .style("cursor",event && "pointer")

    leg_keys.select("rect")
        .attr("width", spacing-2)
        .attr("height", spacing-2)
        .style("fill", colorScale);
 
    leg_keys.select("text")
        .attr("x", 30)
        .attr("y", spacing/2)
        .attr("dy", ".35em")
        .style("font-size", spacing-4)
        .style("text-anchor", "start")
        .text(function(d) { return d; });
       
    leg_keys
        .exit().remove()

  }

})(typeof exports === 'undefined'? this['g3legends']={}: exports);
