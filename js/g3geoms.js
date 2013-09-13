(function(exports){

  // First some utility functions

  // Get the parent's d3 data
  var parentD=function(n){return n.parentNode.__data_old__}

  var parentD=function(n,old){return old && n.parentNode.__data_old__ ? n.parentNode.__data_old__ : n.parentNode.__data__}
  var parentD2=function(n){return n.parentNode.parentNode.__data__}
  var parentD3=function(n){return n.parentNode.parentNode.parentNode.__data__}
  var parentD4=function(n){return n.parentNode.parentNode.parentNode.parentNode.__data__}


  // Get the parent cellfacet's scale property
  var xFacetScale=function(n,old){return parentD2(n,old).xScale} 
  var yFacetScale=function(n){return parentD3(n).yScale}
  // NB: this keyfunction should return a unique key, which means x|color should be unique.
  // If not, then the code can fail.  Current hierarchy implementation does generate a unique
  // X for each, but that will probably change, since the innermost X should probably be
  // supplied from somewhere else.
  var keyFunction = function(d,i){
    // Key should uniquely identify a dot (part), and is used for animation.
    // Note that if key does NOT uniquely define a point then points may
    // be dropped
    if (!_.isUndefined(d.Key)) return _.isDate(d.Key)?[""+(+d.Key)]:(_.isObject(d.Key)?_.values(d.Key):d.Key)
    return i
  }
  
  // labels provide popups.  g3figure should probably only calculate
  // this on demand; would save processing power
  var labelFn = function(colorField) { return function(d) { 
      return !_.isUndefined(d.Label)
        ? _.isObject(d.Label) ? _.values(d.Label).join("\n") : d.Label
        : _.isUndefined(d.XCluster)
          ? d.X
        : _.isObject(d.XCluster) 
          ? _.values(d.XCluster).join("\n")+"\n"+d[colorField]+"\n"+d.Y
          : d.XCluster+"\n"+d[colorField]+"\n"+d.Y 
  } }

  // Position SVG
  var svgTranslate=function(d) {
    return "translate(" + xFacetScale(this)(d.X)  + "," + yFacetScale(this)(d.y) + ")"; 
  }

  //
  // --------------- Now the Geoms --------------------------
  //
  // Each follows basically the same pattern - an object which provides draw and fastdraw functions
  // 
  // fastdraw is only for use when you are neither creating nor deleting elements from the join and
  // you want to bypass the normal transition animations - basically when you are zooming on
  // touch devices and it should be responsive rather than smoothly animated.

  // draw points.
  // yScale input is carried in the facet
  exports.point  = function(plot,globalData,color,event) {
    // subfigure redraws.
    function geom() {
    }

    geom.position = function(d) {
      d
        .attr("transform", svgTranslate)          
        .style("fill", function(d) { 
          return color(d.Color);
        })
    }
   
    geom.draw = function point_draw(plot,data) {
      if (!data) data = globalData
      
      var a = plot.selectAll(".dot")
          .data(data,keyFunction)
  
     a.enter().append("svg:path")
          .attr("class", "dot")
          .call(geom.position)
          .attr("d", d3.svg.symbol().size(36))
          .append("title")
        
      a.select("title")
        .text( labelFn("Color") )
        
      a
        .on("click",event) // if null, removes event
        .style("cursor",event?"pointer":null)
        
      //a.
      //  style("pointer-events",event?"auto":"none") // prevents hover
  
      a
        .transition()
        .call(geom.position)
  
      a.exit()
        .transition()
        .attr("r", 0)
        .remove()
        
      return("path.dot")
    }
    
    geom.fast_redraw = function fast_redraw_point(plot) {
      var a = plot.selectAll(".dot")
  
      a
        .call(geom.position)
    }
    
    return geom
  }
  
  // generate voronoi pick regions (for points).
  // inspired by http://bl.ocks.org/bobmonteverde/2070123
  exports.voronoi  = function(plot,globalData,color,event) {
    // subfigure redraws.
    function geom() {
    }

    geom.positionTransform = function (d) {
      d
        .attr("transform", svgTranslate)          
        .style("fill", function(d) { 
          return color(d.Color);
        })
    }
    
    geom.positionPath = function(l) {
        l
          .x(function(d) { return xFacetScale(this)(d[0]) })
          .y(function(d) { return yFacetScale(this)(d[1]) })
        return (l)
    }
    
        
    geom.positionCircle = function(d) {
      
      var xFacetScale=function(n,old){return parentD3(n).xScale}
      var yFacetScale=function(n,old){return parentD4(n).yScale}
      
      d
        .attr("cx",function(d) { return xFacetScale(this)(d.X) })   
        .attr("cy",function(d) { return yFacetScale(this)(d.Y) })      
    }
   
    geom.draw = function voronoi_draw(plot,data,fast) {
      if (!data) data = globalData
      
      // need to select by class - there's a bug in webkit for clippath selection
      var paths = plot.selectAll(".clippath")
        .data(data,keyFunction)

      paths
        .exit()
        .remove()

      // warning: using 'i' as the clip key creates non unique clip names
      paths
        .enter()
        .append("clipPath").classed("clippath",true)
        .append("circle")
        .attr('r', 15); // click size

        
      paths
        .attr("id", function(d, i) { return "clip-"+d.voronoiClipID;})
        //.transition()
        .select("circle")
          .call(geom.positionCircle)


      var voronoi = plot.selectAll("path.voronoi")
        .data(data,keyFunction)
    
      voronoi.exit().remove()
    
      voronoi
        .enter()
        .append("path").classed("voronoi",true)
        .append("title")    
   
      voronoi
        .attr("clip-path", function(d,i) { return "url(#clip-"+d.voronoiClipID+")"; })
        .attr("d", function(d){
          //return geom.positionPath.call(this,d3.svg.line()).call(this,d.voronoiPath) // possible unscaled linear version
          return d3.svg.line()(d.voronoiPath)
        })        
        // demo fill
      if (false) {  // switch this to true for gratuitous prettyness
        voronoi
        .style("fill", d3.rgb(230, 230, 230))
        .style('fill-opacity', 0.4)
        .style("stroke", d3.rgb(200,200,200))
        .on("mouseover", function(d, i) {
          d3.select(this)
            .style('fill', d3.rgb(31, 120, 180));
          plot.select('circle#point-'+i)
            .style('fill', d3.rgb(31, 120, 180))
         })
         .on("mouseout", function(d, i) {
           d3.select(this)
             .style("fill", d3.rgb(230, 230, 230));
           plot.select('circle#point-'+i)
             .style('fill', 'black')
        });
      } else {
        voronoi
          .style('fill-opacity',"0")

      }
      
      voronoi.select("title")
        .text( labelFn("X") )
        
      voronoi
        .on("click",event) // if null, removes event
        .style("cursor",event?"pointer":null)
      
      /* actually let's use another geom linked to this 
      var points = plot.selectAll("circle.point")
        .data(data,keyFunction)
      points
        .enter().append("circle").classed("point",true)
      points
        .attr("id", function(d, i) { 
          return "geom-"+i; })
        //.transition()
        .attr("r", 4)
        .call(geom.position)
        .attr('stroke', 'none');
        
      points
        .on("click",event) // if null, removes event
        .style("cursor",event?"pointer":null)
        
      points
        .exit().remove()
        
        */
      return(null)
    }
    
    // the fast voronoi redraw?  fiddly, so don't do it.
    // if we ever do, suggest suspending voronoi calculations
    // during the animation.
    geom.fast_redraw = geom.draw
    
    return geom
  }
  
  
  // draw area. y0 is 0 for the moment
  // yScale input is carried in the facet
  exports.area  = function(plot,globalData,color,event) {
    // subfigure redraws.
    function geom() {
    }

    geom.position = function(l) {
        l
          .x(function(d) { return xFacetScale(this)(d.X) })
          .y1(function(d) { return yFacetScale(this)(d.Y) })
          .y0(function(d) { return yFacetScale(this)(0) })
          .defined(function(d) { return !d.Missing })
        return (l)
    }
   
    geom.draw = function area_draw(plot,data) {
      if (!data) data = globalData
      
      var a = plot.selectAll("path.area")
          .data(data)
  
      a.enter().append("path")
          .datum(function(d){return d})
          .attr("class", "area")
          .style("stroke","none")
          .style("fill",function(d){return color(d.key)})
          .attr("d", function(d){return geom.position.call(this,d3.svg.area()).call(this,d.values)})
          .append("title")
        
      a.select("title")
        .text( labelFn("Color") )
                  
      a
        .on("click",event) // if null, removes event
        .style("cursor",event?"pointer":null)
  
      a
     //   .transition()
        .attr("d", function(d){return geom.position.call(this,d3.svg.area()).call(this,d.values)})
  
      a.exit()
    //    .transition()
        .attr("r", 0)
        .remove()
        
      return("path.area")
    }
    
    geom.fast_redraw = function fast_redraw_area(plot) {
      var a = plot.selectAll(".area")
  
      a
        .attr("d", function(d){return geom.position.call(this,d3.svg.area()).call(this,d.values)})
    }
    
    return geom
  }

  // draw points.
  // yScale input is carried in the facet
  exports.line  = function(plot,globalData,color,event) {
    // subfigure redraws.
    function geom() {
    }

    geom.position = function(l) {
        l
          .x(function(d) { return xFacetScale(this)(d.X) })
          .y(function(d) { return yFacetScale(this)(d.Y) })
          .defined(function(d) { return !d.Missing })
        return (l)
    }
   
    geom.draw = function line_draw(plot,data) {
      if (!data) data = globalData
      
      var a = plot.selectAll("path.line")
          .data(data)
  
      a.enter().append("path")
          .datum(function(d){return d})
          .attr("class", "line")
          .style("fill","none")
          .style("strokewidth","1px")
          .attr("d", function(d){return geom.position.call(this,d3.svg.line()).call(this,d.values)})
          .append("title")
        
      a.select("title")
        .text( labelFn("Color") )
                  
      a
        .on("click",event) // if null, removes event
        .style("cursor",event?"pointer":null)
  
      a
     //   .transition()
        .style("stroke",function(d){return color(d.key)})
        .attr("d", function(d){return geom.position.call(this,d3.svg.line()).call(this,d.values)})
  
      a.exit()
    //    .transition()
        .attr("r", 0)
        .remove()
        
      return("path.line")
    }
    
    geom.fast_redraw = function fast_redraw_line(plot) {
      var a = plot.selectAll(".line")
  
      a
        .attr("d", function(d){return geom.position.call(this,d3.svg.line()).call(this,d.values)})
    }
    
    return geom
  }
  
  // pointbar is a bar that is as wide as the rangeband
  exports.point_bar  = function(plot,globalData,color,event) {
    // subfigure redraws.
    function geom() {
    }

    var x_pad_minimum = 4; // don't pad for sizes less than 4 pixels
    var x_padding = 1; // pixel padding to put x-space between pointBars
    var y_expand = 1; // pixel padding to make the pointBar more than 1 pixel high

    geom.position = function(d) {
      d
        .attr("x", function(d) { 
          var x=xFacetScale(this)(d.x)
          return xFacetScale(this).rangeBand() > x_pad_minimum ? x + x_padding : x
        })
        .attr("width", function(d) { 
          var xd=xFacetScale(this).rangeBand()
          return xd > x_pad_minimum ? xd - x_padding : xd
        }) 
        .attr("y", function(d) { return yFacetScale(this)(d.y) - y_expand })
        .attr("height", function(d) { return 1+2*y_expand })
        .style("fill", function(d) { return color(d.Color); })
    }  
  
    geom.draw = function pointBar_draw(plot,data) {
      if (!data) data = globalData
      
      var a = plot.selectAll("rect.bar")
         .data(data,keyFunction)
  
  
      a.enter()
        .append("rect")
        .attr("class", "bar")
        .call(geom.position)
        .append("title");
      
      a.select("title")
        .text( labelFn("Color") )
  
      a
        .transition()
        .call(geom.position)
        
      a
        .on("click",event) // if null, removes event
        .style("cursor",event?"pointer":null)
        
      a.exit()
        .transition()
        .attr("height", 0)
        .attr("y", function(d){return yFacetScale(this)(0)})
        .attr("width", 0)
        .remove()
        
      return("rect.bar")
    }
    
    geom.fast_redraw = function fast_redraw_point(plot) {
      plot.selectAll("rect.bar")
       .call(geom.position)      
    }
    
    return geom
  }
  
    // pointbar is a fixed height floating bar that is as wide as dx
  exports.point_range_bar  = function(plot,globalData,color,event) {
    // subfigure redraws.
    function geom() {
    }

    var x_pad_minimum = 4; // don't pad for sizes less than 4 pixels
    var x_padding = 1; // pixel padding to put x-space between pointBars
    var y_expand = 1; // pixel padding to make the pointBar more than 1 pixel high
    
    geom.position = function(first) { return function(d) {
      d
        .attr("x", function(d) {
          var xd = xFacetScale(this)(+d.X + d.DX)- xFacetScale(this)(d.X);
          return xFacetScale(this)(d.X) 
            + ((xd > x_pad_minimum) ? x_padding : 0)
        })
        .attr("width", function(d) { 
          var xd = xFacetScale(this)(+d.X + d.DX)- xFacetScale(this)(d.X);
          return xd > x_pad_minimum ? xd - x_padding : xd
        })
        .attr("y", function(d) { return yFacetScale(this)(d.y) - y_expand })
        .attr("height", function(d) { return 1+2*y_expand })
        .style("fill", function(d) { return color(d.Color); })
    }}
  
    geom.draw = function point_range_bar_draw(plot,data) {
      if (!data) data = globalData
      
      var a = plot.selectAll("rect.bar")
         .data(data,keyFunction)
  
  
      a.enter()
        .append("rect")
        .attr("class", "bar")
        .call(geom.position())
        .append("title");
        
      a.select("title")
        .text( labelFn("Color") )
  
      a
        .transition()
        .call(geom.position())
        
      a
        .on("click",event) // if null, removes event
        .style("cursor",event?"pointer":null)
        
      a.exit()
        .transition()
        .attr("height", 0)
        .attr("y", function(d){return yFacetScale(this)(0)})
        .attr("width", 0)
        .remove()
        
      return("rect.bar")
    }
    
    geom.fast_redraw = function fast_redraw_point(plot) {
      plot.selectAll("rect.bar")
       .call(geom.position())      
    }
    
    return geom
  }

  // draw the stacked bars.  This function is called only once,
  // with the plot argument being a selection of all facets.
  // yScale input is carried in the facet
  
  exports.bar = function(plot,globalData,color,event) {
    // subfigure redraws.
    function geom() {
    }
 
    var x_padding = 1;
 
    geom.position = function(first) { return function(d) {
        d
          .attr("x", function(d) { return xFacetScale(this)(d.X) + x_padding; })
          .attr("width", function(d) { return xFacetScale(this).rangeBand() - x_padding; })
          .attr("y", first?function(d) { return yFacetScale(this)(0) }:function(d) { return yFacetScale(this)(d.y0 + d.y) })
          .attr("height", first?0:function(d) { return yFacetScale(this)(d.y0) - yFacetScale(this)(d.y0 + d.y) })
          .style("fill", function(d) { return color(d.Fill); })
      }} 
  
    geom.draw = function bar_draw(plot,data) {
      if (!data) data = globalData    

      var a = plot.selectAll("rect.bar")
         .data(data,keyFunction)
  
      a.exit()
        .transition()
        .attr("height", 0)
        .attr("y", function(d){return yFacetScale(this)(0)})
        .attr("width", 0)
        .remove()
    
      a.enter()
        .append("rect")
        .attr("class", "bar")
        .call(geom.position(true))
        .append("title");
        
      a.select("title")
        .text( labelFn("Fill") )

      a
        .on("click",event) // if null, removes event
        .style("cursor",event?"pointer":null)

      a
        .transition()
        .call(geom.position())
        
      return("rect.bar")
    }
    
    geom.fast_redraw = function fast_redraw_point(plot) {
      plot.selectAll("rect.bar")
       .call(geom.position)      
    }
    
    return geom
  }
  
  // draw non stacked bars with a linear x scale and X, DX.  This function is called only once,
  // with the plot argument being a selection of all facets.
  // yScale input is carried in the facet
  exports.range_bar = function(plot,globalData,color,event) {
    // subfigure redraws.
    function geom() {
    }

    var x_padding = 1;

    geom.position = function(old) { return function(d) {
        d
          .attr("x", function(d) { return xFacetScale(this,old)(d.X) + x_padding; })
          .attr("width", function(d) { return xFacetScale(this,old)(+d.X + d.DX)- xFacetScale(this,old)(d.X) - x_padding; })
          .attr("y", old?function(d) { return yFacetScale(this,true)(d.y0) }:function(d) { return yFacetScale(this)(d.y0 + d.y) })
          .attr("height", old?0:function(d) { return yFacetScale(this,true)(d.y0) - yFacetScale(this)(d.y0 + d.y) })
          //.attr("y", function(d) { return yFacetScale(this)(d.y0 + d.y) })
          //.attr("height", function(d) { return yFacetScale(this)(d.y0) - yFacetScale(this)(d.y0 + d.y) })
        
          .style("fill", function(d) { return color(d.Fill); })
      }}

    geom.draw = function(plot,data) {
      if (!data) data = globalData    

      // doesn't like ordinal!
      var a = plot.selectAll("rect.bar")
         .data(data,keyFunction)

      a.exit()
        .attr("height", 0)
        .transition()
        .call(geom.position(true))
        .attr("y", function(d){return yFacetScale(this)(0)})
        .attr("width", 0)
        .remove()
  
      a.enter()
        .append("rect")
        .attr("class", "bar")
        .call(geom.position(true))
        .append("title");
        
      a.select("title")
        .text( labelFn("Fill") )

      a
        .transition()
        .call(geom.position())
        
      return("rect.bar")
    }
    
    geom.fast_redraw = function fast_redraw_point(plot) {
      plot.selectAll("rect.bar")
       .call(geom.position())
    }
        
    return geom;
  }
  
})(typeof exports === 'undefined'? this['g3geoms']={}: exports);
