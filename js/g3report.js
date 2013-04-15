/*
  g3report is for when you have very dynamic content heavy pages with
  mixes of tables, graphs, lists and text.  It is all specified on the 
  server in one go as a list.
  
  report <- list(item1, item2, item3, ...)
  
  each item can be a figure+table or a list, text or anything you extend g3figure to do

  It is always used for plots, usually in degenerate mode (one pane)

 --------------------------------
 |report  (this)                |
 |  --------------------------  |
 |  |pane>figure+table       |  |
 |  --------------------------  |
 |  --------------------------  |
 |  |pane>table|  |  |  | |  |  |
 |  --------------------------  |
 |  --------------------------  |
 |  |pane>figure+table       |  |
 |  --------------------------  |
 |  ...                         |
 --------------------------------

  It may also be suitable for a dynamically generated short page containing small
  inline graphics.

  Note that each item in a report has a name, and names which are re-used in other
  pages (may be) animated.  For example a minigraph should animate into the full graph
  when the page moves from a report to a simpler, larger (and possibly more complex) view.
  
  Not currently used in the demo, except that it's used in degenerate (1-pane) mode for all output.
  
  Probably this role could be achieved using dynamicUI, although that currently has no
  way to send up generated svg content in a single stroke, so the UI may render in parts
*/
(function(exports){
  
  exports.showSinglePane = function(paneData,index) {
    // a Single Pane is a graph or table or 'portlet' (summary box) or text
    // Each pane has a title (name) and a content.
    
    var node = d3.select(this)
    var paneType
    
    // we can possibly get an array of graphs in a plot node.  This is either a 
    // poor design decision or an excellent way to support some graph types which 
    // might not be otherwise currently possible
    if (!_.isArray(paneData)) {
      paneType = paneData.type
    } else {
      if(paneData.length == 0) return;
      paneType = paneData[0].type
    }
    
    switch(paneType) {
      case "table": {
        var strData = aestheticUtils.decodeData(paneData);
        var newTable = htmltable.updateTable(node,paneData.grid,strData,paneData.structure,{})   
        break;
      } 
      case "plot": {
        g3figure.newPlot(node.node(),paneData)
        break;
      }
      case "list":
      case "text":
      case "alert":
      case "title":
      case "html":
      {
        g3htmlPanes[paneType](node,paneData)
        break;
      }
    }
  }
  
  exports.showPaneSet = function(node) {
    // a div per entry in the paneset
    var paneDiv = node
      .selectAll("div.pane")
      .data(_.identity,function(x){return x.type + x.name})
      
    paneDiv.enter()
      .append("div")
      .attr("class","pane")
      
    paneDiv.order()
      
    paneDiv.exit().remove()
    
    paneDiv.each(g3report.showSinglePane)
  }
  
  exports.newInfo = function(el,message) {
    // built the root report node
    var reportNode=d3.select(el)
        .selectAll("div.report") // there's only one.
        .data([message.data],_.identity)
      reportNode.enter()
        .append("div").attr("class","report")
      reportNode.exit().remove();
    
    reportNode
      .call(this.showPaneSet)
  }
  
})(typeof exports === 'undefined'? this['g3report']={}: exports);
