// d3 Bindings - mainly boilerplate - please ignore.
// ================================================

var networkOutputBinding = new Shiny.OutputBinding();

$.extend(networkOutputBinding, {
  find: function(scope) {
    return $(scope).find('.shiny-network-output');
  },
  
//
// The real works starts here
// ==========================
  
  renderError: function(el, error) {
    // todo: replace with general purpose error handling for
    // all output types.
    if (error.call != null && error.call != "NULL") { 
      error.message += " in " + error.call
    }
    g3widget.showError(el,"Server reports: " + error.message);
  },
  renderValue: function(el, message) {
    g3widget.clearError(el)
    try {
      if(message.type && message.type == "report") {
        // info is a mix of svg and tables for e.g. a single checkpoint.
        g3report.newInfo(el,message);
      } else {
  
        // plot is a single svg plot and a data table
        // Synthesize an info wrapper for this.
        var infomessage = {type:"report",
                      data:[message]}
        
        g3report.newInfo(el,infomessage);
      }
      // If we get here without an error, we hide any extant 
      // error boxes.
      g3widget.clearError(el)
    } catch (error) 
    {
      // The error will either be a standard javascript error
      // or a custom one thrown by part of the hierarchy - 
      // an object with fields.
      // In response to an error, the display parts of the widget
      // will be hidden, and the error box will be shown.
      g3widget.showError(el,error.message)
    }
  }
});
      
Shiny.outputBindings.register(networkOutputBinding, 'scurve.networkbinding');
