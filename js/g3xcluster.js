(function(exports){

  // Build a clustered X axis by partitioning X space according to the cluster
  // Aesthetic.  These contain multiple X-axes, and have width based upon 
  // either cardinality or range of the contained or global X value.  If
  // X is null then the partition sizes of the smallest partition are equal.
  // TODO: does not account for cardinality or range currently
  //
  // Bug: always sizes blocks based upon population.  should allow for range,
  // constant value, etc.  
  // Use the handy parent property that it decorates leaves with, but be sad
  // it to decorate leaves also creates this population size situation.
  exports.hierarchX = function(allData,axisname,XClusterAesthetic,width,height) {
    
    // Hierarchy name hack: usually aes(X) is a name referring to a whole structure
    // element, and we can use that as the hierarchy root name (axis title).  If not,
    // just put a 'placeholder' name in.  It would be nice to fix this properly, but
    // don't want to create new names in structure since it should really represent
    // a fixed structure independent of the graph.  In fact it should use the axis
    // title?  Unless the axis is compound categorical then linear.  
    var hierarchyRootName = axisname
    if (_.isObject(hierarchyRootName)) 
      hierarchyRootName = "All"
    
    var nester = d3.nest() 

    // load the nester with the xaesthetic keys.
    var dataTree = {key:hierarchyRootName, values:
      _.keys(XClusterAesthetic).reduce(
        function(nest,xkey){
          return nest.key(
            function(data){
              return data["XCluster"][xkey]
      }).sortKeys(d3.ascending)},nester).entries(allData)
    }
    
      
    // the height used for y partitioning needs to take into account the
    // values row (which we aren't using, and the All row, which isn't in
    // the original aesthetic), hence it's height*(n+2)/(n+1)
    var xlength = 1+_.values(XClusterAesthetic).length
    var rowsToDrop=1
    // rowsToDrop is trying to drop the inner nests, since
    // the very innermost may be too small to plot, or just an arrangement
    // of non clustered components of a cluster.
    // need to check this makes sense - even for a list of length 1.
    // and in the presence of XCluster with or without an X
    if (xlength == 1) rowsToDrop=0; // voodoo programming
    var adjustedHeight = height * (xlength+rowsToDrop)/(xlength+0)
      
    var countWeight = false; // leaves weighted by count or just 1.  other possibilities exist e.g. (x-domain)
      
    var partition = d3extend.partition2()
      .value(function(n,dep){
        return((dep>=xlength)?0:(countWeight?n.values.length:1))
      })
      .sort(null)
      .size([width, adjustedHeight])
      .children(function(d){ 
        // Note that partition also sets an x value on all nodes,
        // and where the innermost cluster contains multiple data
        // nodes will arrange them in some x ordering.  This is
        // useful but may not be the desired behaviour - you may
        // want to position at parent.x or even use parent.x and parent.dx
        // to insert a new axis for the cluster
        return d.values
      })
      
    // note: x and y of allData are blown away by this.  Each aesthetic
    // node also gets a parent node, which contains the x,dx etc of its
    // parent.
    
    var partitionedNodes=partition.nodes(dataTree)
        .filter(function(d){return d.depth < 1 + xlength - rowsToDrop})
    return partitionedNodes
  }
  
    // draw the hierarchical-x axis
  exports.hierAxis = function(plot,axisParts,y,width,height,event,formatter) {
    // only plot nested nodes in the hierarchy (not the leaves)
    // since leaves don't have a key property, filter on that.
    function hasKeyFilter(key) { return function(d) { return _.has(d,key)}}
    
    // Note: hieraxis should move to leave space for the x axis where present.
    var axisGroup=plot.select(".xaxisDecorate")
       .attr("transform", "translate(0," + (y) + ")")
    axisGroup.select("text").text("") 

  
    var axisBG=axisGroup.selectAll("rect.axis_background").data([1])
    axisBG.enter().append("rect").attr("class","axis_background")
    
    axisBG
      .style("fill","url(#gradient)")
      .attr("y",1)
      .attr("width",width)
      .attr("height",height)
      
    //axisBG.exit().remove()
       
    var cells=axisGroup
      .selectAll("g.hiercell")
      .data(axisParts.filter(hasKeyFilter("key")),
        function(d){
          return _.pluck(g3functional.followChain("parent")(d),"key")
        })
    
    // construct the box elements of the hierarchy out of a g, rect, and an html object (for text wrapping)
    cells
      .enter()
      .append("g").attr("class","hiercell")
      .attr("transform", function(d){
        return "translate(" + d.x + "," + (height-(d.depth)*d.y) + ")"
      })
      .style("opacity","0")
      .each(function() {
        var s = d3.select(this)
        var HF = s.append("foreignObject").attr("class","htmltextF")
          .attr("x", 1)
          .attr("y", 2)
        HF
          .append("xhtml:body").attr("class","htmltext").attr("xmlns","http://www.w3.org/1999/xhtml")
          .style("background-color", "transparent")
          .style("text-align","left")
          .html(function(d) { 
            if (formatter) {
              return d.key.replace(new RegExp(formatter[0]),formatter[1])
            }
            return d.key; 
          });
        s.append("line").attr("class", "leftline tick")
        s.append("line").attr("class", "rightline tick")
        s.append("title")
          .text( function(d) { return d.key } );
        return this;
      })

    // how to build the hierarchy cell
    var hierCell=function(d) {
      cell=d3.select(this)
      cell.select(".leftline")
          .attr("x1",0)
          .attr("y1",1)
          .attr("x2",0)
          .attr("y2",function(d) { return d.dy; })
      cell.select(".rightline")
          .attr("x1",function(d) { return d.dx; })
          .attr("y1",1)
          .attr("x2",function(d) { return d.dx; })
          .attr("y2",function(d) { return d.dy; })
    }
    
    cells
      .transition()
      .style("opacity","1")
      .attr("transform", function(d){
          return "translate(" + d.x + "," + (height-d.y-d.dy) + ")"
        })
      .each(hierCell)
       
    cells
      .on("click",event)
      .style("cursor",event && "pointer")
      .select(".htmltextF")
      .attr("width", function(d) { return d.dx-2; })
      .attr("height", function(d) { return d.dy-1; })

    cells.exit()
      //.transition()
      .remove()
  }

})(typeof exports === 'undefined'? this['g3xcluster']={}: exports);
