(function(exports){

  // Do calculation for stacked bars.  updates the root y aesthetic
  exports.barStack = function(allData, groupAesthetic) {

    var barStack=d3.layout.stack()
      .values(function(d) {return d.values})
     // .order("inside-out")
      .y(function(d) {return d.Y})
      .x(function(d) {
        return d.parent.x // TODO: fixme
      })
     
    var dnest=d3.nest().key(function(d) {return d[groupAesthetic]; })
      //.key(function(d) { return d.label; })
      .entries(allData)
    // WARNING: the input data needs an x,y array of the same length for each
    // level, otherwise "TypeError: Cannot read property '1' of undefined"
    // i.e. don't drop zeroes. (unless a whole column is 0)
   
    // running mystack calculates the y position, and updates the original data.
    nest_data=barStack(dnest)
  
    return nest_data // but it modifies data, so no worries.
  }
  
  // Perform the voronoi calculation over X and Y, producing
  // a voronoi path aesthetic.  requires x and y scale currently,
  // but if scale can be applied to the generated paths this could
  // be omitted to reduce re-calculation.  Note that this would mean
  // that the voronoi generated lines would be in the domain space, 
  // which clearly fails for non-quant scales.
  // It also adds a voronoiClipID to generate a unique
  // reference to the clipping mask, since they appear to need global
  // names.
  // Should be done per cellFacet.
  // Applies best to points (or symbols) type geoms, works at the vertices
  // of lines, sort of works for pointbars and nearly works for range_point_bars.
  // not so great for rangebars or bars (but it's less important on bars which are)
  // more clickable anyway.
  // For these a voronoi algorithm that can work on quadrilaterals rather than
  // points may be required.
  //
  // builds on d3.geom.voronoi by writing the generated path back into the
  // original data
  //
  // should re-execute after changing data or panning or zooming (for now)
  exports.voronoi = function(cellFacetData, xScale, yScale) {
    d3.geom.voronoi()
      .x(function(d) {  
        return xScale(d.X)
      })   
      .y(function(d) {  
        return yScale(d.Y)
      })
      (cellFacetData)
      .map(function(d,i){
        cellFacetData[i].voronoiPath = d;
        cellFacetData[i].voronoiClipID = Math.random()
      })
  }

  
})(typeof exports === 'undefined'? this['g3stats']={}: exports);
