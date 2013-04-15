/*
  g3htmlpanes
  
  a report contains multiple panes.  These often contain figures, but might not.
  some other options are found below.
*/

(function(exports){

 exports.list = function(pane,list) {
     
    var h=pane.selectAll("h4")
      .data([list.title].filter(function(x){return !_.isUndefined(x)}))
    h.enter().append("h4")
    h.text(_.identity)
    h.exit()
     
    var x=pane.selectAll("ul").data(list.list)
    x.enter().append("ul")
    x.exit().remove()
    var y=x.selectAll("li").data(function(d){return _.pairs(d)})
    y.enter().append("li").append("a")
    y.select("a").attr("href",function(d){
        return d[1]
        }
    )
     .text(function(d){
        return d[0]
        })
     .attr("target","_blank")
    y.exit().remove()
  }  
  
  exports.text = function(pane,text) {
          
    var x=pane.selectAll("div").data([text.text])
    x.enter().append("div")
    x.text(_.identity)
    x.attr("class",function(d){return d.class})
    x.exit().remove()
  }
  
  exports.title = function(pane,text) {
          
    var x=pane.selectAll("h4").data([text.text])
    x.enter().append("h4")
     .attr("class",function(d){return d.class})
    x.text(_.identity)
    x.exit().remove()
  }
  
  exports.alert = function(pane,alert) {
    // uniquely for alerts we always clear the contents.
    pane.selectAll("div").remove()
    var x=pane.selectAll("div").data([alert.text])
    // see http://twitter.github.com/bootstrap/components.html#alerts for types
    x.enter().append("div").attr("class","alert alert-" + alert.level)
    x.append("strong").text(alert.level + "  ")
    x.append("span").text(alert.text)
    x.exit().remove()
  }
  
  // note that the html attribute can be the output of
  // shiny::renderTable(x)() or similar
  exports.html = function(pane,html) {
    var x=pane.selectAll("span").data([html.html])
    // see http://twitter.github.com/bootstrap/components.html#alerts for types
    x.enter().append("span")
    x.html(_.identity)
    x.attr("class",html.class)
    x.exit().remove()
  }

})(typeof exports === 'undefined'? this['g3htmlPanes']={}: exports);
