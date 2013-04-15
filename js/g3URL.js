(function(){
 
  var silentChange=false;
  var firstChange=true;
  
  var changeInputsFromHash = function(newHash) {
    // get hash OUTPUT
    var hashVal = $(newHash).data().shinyInputBinding.getValue($(newHash))
    var hashParts = hashVal.substring(1).split(",")
    _(hashParts).chain()
      .map(function(x){return x.split("=")}) // get keys and values encoded in hash
      .object()                               // convert them all to a javascript 'hash' object
      .map(function(value,key) {              // process each in turn
      // find input bindings corresponding to them

      var el=$("#"+key)
      
      if (el.length > 0 
         && ((el.data().shinyInputBinding && el.data().shinyInputBinding.getValue(el[0])) || el.val()) != decodeURIComponent(value)) {
      
        console.log("Attempting to update input " + key + " with value " + value);
        if (el.attr("type") == "checkbox") {
          // doesn't handle multiples
          el.prop('checked',value=="TRUE")
          el.change()
        } else if(el.attr("type") == "radio") {
          throw("G3plot doesn't know how to update radio inputs")
        } else if(el.attr("type") == "slider") {
          // This case should be setValue but it's not implemented in shiny, so
          // use jQuery instead.  Doesn't handle multiples
          el.slider("value",value)
        } else { 
          // Handle case of multi selection.  
          if (el.prop("multiple")) {
            var newMultiVals=value.split("|").map(decodeURIComponent)
            if (!_.isEqual(el.val(), newMultiVals)) {
              el.data().shinyInputBinding.setValue(el,newMultiVals)
              el.change()
            }
          } else {
            el.data().shinyInputBinding.setValue(el[0],decodeURIComponent(value))
            el.change()
          }
        }
      }
    })
  }
  
  var HashOutputBinding = new Shiny.OutputBinding();
  $.extend(HashOutputBinding, {
    find: function(scope) {
      return $(scope).find(".hash");
    },
    renderError: function(el,error) {
      console.log("Shiny app failed to calculate new hash");
    },
    renderValue: function(el,data) {
      console.log("Updated hash to " + data);
      silentChange = true;
      document.location.hash=data;
      if(firstChange) {
        changeInputsFromHash(el);
        firstChange=false;
      }
    }
  });
  Shiny.outputBindings.register(HashOutputBinding);
  
  var HashInputBinding = new Shiny.InputBinding();
  $.extend(HashInputBinding, {
    find: function(scope) {
      return $(scope).find(".hash");
    },
    getValue: function(el) {
      return document.location.hash;
    },
    subscribe: function(el, callback) {
      window.addEventListener("hashchange",
        function(e) {
          if (!silentChange) {
            changeInputsFromHash(el);
          } else {
            silentChange = false; // maybe RACE here.
          }
          callback();
        }
        , false);
    }
  });
  Shiny.inputBindings.register(HashInputBinding);
 
// should add a package name?
})();
