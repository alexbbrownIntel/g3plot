// g3events includes functions to consume various events and perform actions
(function(exports){


  // function to generate (for a datum) a function which updates a shiny input
  // with values (XFilterKey or X) from the brushed data.  This allows the 
  // server to update the presented data or the URL or take some other action.
  exports.updateShinyInputFromGeomFn = function updateShinyInputFromGeomFn(inputId,filterField) {
    return function updateShinyInputFromGeom(datum) {
      var el = $(inputId)
      
      // This is the non ordinal version, but it's also customised to send the node value 
      // to (an array of) single valued inputs
      var filterKey=datum[filterField]
            
      var els = inputId.map?inputId.map(function(el){return $(el)}):[$(el)]

      if (els.length==0) throw("Brush cannot locate input elements for update :"+el)

      _.map(els,function(d,i){
        if (!_.isEqual(d.val(),filterKey)) {
          //els[i].data().shinyInputBinding.setValue(els[i], edgeKeys[i])
          d.val(filterKey)
          // magical code to update a tab label
          if (d.data().toggle == "tab") { 
            //d.text(filterKey) 
            d.click()
          }
          d.trigger("brushChange").change();
        }
      })
    }
  }
  
  // inputs should either be true - for auto selection of matching inputs,
  // or an object happing cluster levels to input names
  exports.updateShinyInputFromHierFn = function updateShinyInputFromHierFn(inputs,xClusterAestheticValue) { 
    // datum is a hierarchy / cluster node value - as created by hierarchX
    return function updateShinyInputFromHier(datum){
      if (datum) {        
        if (inputs) {
          var fieldNames = 
            _.isObject(inputs)
            // field named have been passed in
            ? _(xClusterAestheticValue).chain().keys().map(function(levelName) {
              return inputs[levelName]
            }).value()
            // field names should be automatically discovered
            : _.values(xClusterAestheticValue)
            
          // assume that each hierarchy level name (in the data table)
          // has an input 'search' field.  update the search for the current level
          // and clear the searches for all subsidiary levels.
          
          // first set the corresponding input for the current cell and all its parents          
          g3functional.followChain("parent")(datum).map(function(node) {
            $("#"+fieldNames[node.depth-1]).val(node.key).change()
          })

          // then clear child search fields
          // if a multiple levels update the same field this will fail to operate correctly
          _.values(fieldNames)
            .filter(function(l,i){return i >= datum.depth 
                                  && l != fieldNames[datum.depth-1]})
            .map(function(iname){$("#"+iname).val("").change()})
        } else {
          // filters operate on structure names, not aesthetic names
          // to allow different plots to link filters
          var hierLevel=[_.values(xClusterAestheticValue)[datum.depth-1]]
          // just set filters which will update html table etc.  NOTE:
          // this is the source of the bug in USArrests
          g3figure.filter.update(
            datum?_.object(hierLevel,[function(x){ 
                                    return x==datum.key
                                  }])
             :{});
        }
      }
    }
  }

  // function to generate (for a brush) a function which updates a shiny input
  // with values (XFilterKey or X) from the brushed data.  This allows the 
  // server to update the presented data or the URL or take some other action.
  exports.updateShinyInputFromBrushFn = function updateShinyInputFromBrushFn(inputSpec,throttle,aesStructure,aesData,scaleX) {
    var inputId = inputSpec.input
    // should we send the edge values or all the members.
    var range = inputSpec.value == "range"
    
    var unThrottled = function updateShinyInputFromBrush(brush) {
      
      // break an event loop by suppressing reads from the text fields
      // during brushing.
      brush.selfupdate = 1
      // the filter is done on X, but we may be interested in writing 
      // a different value to the input fields.
      var filterField = aesStructure.XFilterKey?"XFilterKey":"X"
      
      if (scaleX == "ordinal") {
        if (range) throw({message:"ordinal brushes do not support filter ranges"})
        // Ordinal brushes can't do the invert operation so we have to do it for them
        // This clause outputs ALL the values
        var filterKeys=_(aesData).chain().filter(function(record){
          // RANGEBAND CODE
          return g3math.overlapRangeF(brush.extent())(
            [brush.x()(record["X"]),
             brush.x()(record["X"])+brush.x().rangeBand()])
        }).pluck(filterField).value()
        var el = $(inputId)
        // updates a single value search input with a string being the concatenation of all the values.
        el.val(filterKeys.join("|")).change()
      } else {
        // This is the non ordinal X version, but it's also customised to send only the edge values,
        // to a multi-valued input.
        // TODO: this is really the filterkey version - there should be a pure range version
        // which just writes the brush edges.
        var filterKeys=_(aesData).chain().filter(function(record){
          // Note that doesn't take into account rangebands, so 
          // selection may feel a little odd.
          return record.DX
            ? g3math.overlapRangeF(brush.extent())(
                [record["X"],
                 +record["X"]+record["DX"]]
                 )
            : g3math.inRangeF(brush.extent())(record["X"])

        }).pluck(filterField).value()
        
        // linear X only sends edge values, but
        // if XFilterKey is specified, all values are sent
        
        if (!range) {
          var el = $(inputId)
          // updates a single value search input with a string being the concatenation of all the values.
          el.val(filterKeys.join("|")).change()
        } else {
          // this bit assumes it's X.  even though it mentions filterKeys :-(
          // note that min, max may not be appropriate here since they are applied to 
          // XFilterKey which is not necessarily sorted that way.
          // Want first or last when aesData is ordered by X
          var edgeKeys=[_(filterKeys).min(),_(filterKeys).max()]
          edgeKeys = _.map(edgeKeys,function(x){return (_.isDate(x))?(""+(+x)):_.isFinite(x)?x:undefined})
          
          var inputIds = inputId.map?inputId:[inputId]
          var els = inputIds.map(function(el){return $(el)})
    
          if (els.length==0) throw("Brush cannot locate input elements for update :"+el)
    
          if (els.length==1) // for multi-selects 
          {     
            var el=els[0]
            if (edgeKeys.length != 0 && !_.isEqual(el.val(), edgeKeys)) {
              el.data().shinyInputBinding.setValue(el, edgeKeys)
              el.change()
            }
          } else 
          {
            if (edgeKeys.length != 0)
              _.map(_.range(0,els.length),function(i){
                if (!_.isEqual(els[i].val(),edgeKeys[i])) {
                  //els[i].data().shinyInputBinding.setValue(els[i], edgeKeys[i])
                  els[i].val(edgeKeys[i])
                  els[i].change();
                }
              })
          }
        }
      }
      
      brush.selfupdate = 0 // yuck
    }
    if (!_.isUndefined(throttle)) {
      return _.throttle(unThrottled, 500);
    } else {
      return unThrottled
    }
  }
  
  // function to generate (for a brush) a function which updates a g3figure filter
  // with values (XFilterKey or X) from the brushed data.  This allows the client
  // to adjust or change the scope of the presented data.
  exports.updateFilterFromBrushFn = 
    function updateFilterFromBrushFn(aesStructure,aesData, scaleX) {
    return function updateFilterFromBrush(brush) {
      var filterSpec = {} 
      // check if the brush is not empty
      if (brush.extent()[1].valueOf()!=brush.extent()[0].valueOf()) {  
        var filterField = aesStructure.XFilterKey?"XFilterKey":"X"
  
        if (scaleX == "ordinal" ) { // it's not scaleX we care about but scale filterField
          // collect all the X keys that are in range on the brush axis
          // assumes ORDINAL axis.
          var filterKeys=_(aesData).chain().filter(function(record){
            // RANGEBAND CODE
            return g3math.overlapRangeF(brush.extent())(
              [brush.x()(record["X"]),
               brush.x()(record["X"])+brush.x().rangeBand()])
          }).pluck(filterField).value()
          // build a function that filters on this
          var filterFn=function(filterValue){return _.contains(filterKeys,filterValue)}
          // build this function into a filter structure
          filterSpec=_.object([aesStructure[filterField]],[filterFn])
        } else if (aesStructure.XFilterKey) {
          // assume (possibly incorrectly) that a non-X filter is not linear
          // in other words capturing the edges is insufficient.  Could add
          // a scaleXFilterKey="linear" or similar to bypass this?
          var filterKeys=_(aesData).chain().filter(function(record){
            // Note that doesn't take into account rangebands, so 
            // selection may feel a little odd.
            return record.DX
              ? g3math.overlapRangeF(brush.extent())(
                  [record["X"],
                   +record["X"]+record["DX"]]
                   )
              : g3math.inRangeF(brush.extent())(record["X"])
  
          }).pluck(filterField).value()
          // build a function that filters on this
          var filterFn=function(filterValue){return _.contains(filterKeys,filterValue)}
          // build this function into a filter structure
          filterSpec=_.object([aesStructure[filterField]],[filterFn])
        }
        else if (scaleX /* what? */) {
          // some sort of scalar we hope
          // NOTE: range_bar DX is not taken into account here because the 
          // filter spec is only capable of conjunction or single filters,
          // not disjunction.  Since one use of range_bar is to simulate
          // rangeband in linear space, perhaps expanding the right hand
          // side of extent by a sample DX would be enough.
          var extent = brush.extent() // it's not scaleX we care about but scale filterField
          if (aesStructure.DX) {
            var sample_range_bar_expander = aesData[0].DX; // a crummy choice but hey
            extent[0] = extent[0] - sample_range_bar_expander
          }
          var filterFn=g3math.inRangeF(extent)
          filterSpec=_.object([aesStructure[filterField]],[filterFn])
        }
      } 
      // the brush is empty
      // TODO this filter should be the filter for THIS
      // plot, not the global g3figure object.
      g3figure.filter.update(filterSpec)
    }
  }

})(typeof exports === 'undefined'? this['g3events']={}: exports);
