// htmltable is a module to handle the conversion of different types of data structure into an HTML table.
(function(exports){
  
  if (typeof require !== 'undefined') {_=require('underscore');}

  // updateTable grandfathered in from g3widget.js.  will crack into parts soon.
  // tableNode is the node to base it off.  does not erase contents except by action of d3
  // graph is the input data.  not currently used, a bit broken!
  // tableAesthetic is sort of weak, but describes (roughly) the way the csv must be plotted
  // structuredData is the main data for the plot, structured
  // structure is the description of the data structure
  // filterSet is an object mapping structure keyCells to filter functions.  simplest case is {}.
  exports.updateTable=     
    function(tableNode,tableAesthetic,structuredData,structure,filterSet) { // missing arguments here
      
      var tableWalker=structureWalker.structureWalker()
      var records = structuredData.map(aestheticUtils.applyAesthetic(tableAesthetic))
      var tableStructure = aestheticUtils.applyAesthetic(tableAesthetic)(structure)

      var recordFilter=aestheticUtils.filterFromFilterSpec(filterSet,tableStructure); 
      var sortKey = tableStructure.sort
      
      var tableData = 
        {head: tableStructure,
         body: records.filter(recordFilter)}
      
      if (_.has(tableAesthetic,"group")) {
        htmltable.nestedTable(tableNode, tableData, undefined)
      } else {
        if (_.isObject(tableData.head.value)) {
          htmltable.flatStructuredTable(tableNode, tableData, sortKey)
        } else {
          htmltable.flatTable(tableNode, tableData)  
        }
      }
  } // end of updateTable
  
  // flatTable draws a table from non-nested data
  // it expects tableData in the format:
  // tableData = 
  //    {head: tableStructure,
  //     body: records.filter(recordFilter)}

  exports.flatTable=function(tableNode, tableData) {
  
    var table = tableNode.selectAll("table").data([tableData],function(x){return "flat"})
    
    var new_table = table.enter().append("table")
    new_table.append("thead").append("tr")
    new_table.append("tbody")
    new_table.attr("class","data table table-bordered table-condensed")
  
       // the HEAD
    var columns = table.select("thead").select("tr")
      .selectAll("th")
      .data(function(d){
        return _.values(d.head)
      })
    columns
      .enter()
      .append("th")
      .attr("class","key") // helps to delete them in nested view
    columns
      .text(_.identity)
      
    // the BODY
    var rows=table.select("tbody")
      .selectAll("tr")
      .data(function(d){
        return d.body
      })
    rows
      .enter()
      .append("tr")
    var cells = rows
      .selectAll("td")
      .data(function(d){
        // a single record
        return _.values(d);
      })
      
    rows.order()
      
    cells
      .enter()
      .append("td")
      .attr("class","key")
      
    cells
      .attr("width","1*")
      .text(_.identity)
      
    table.exit().remove()
    columns.exit().remove()
    rows.exit().remove()
    cells.exit().remove()
  }
  
  // generate a table from 'flat' data (one record per row)
  // that nonetheless has non-flat 'structure' - nested groups.
  // tableNode - where in the DOM to build the table
  // tableData - the data structure of the table:
  //   list(head=..., body=...)
  //     head: the column names( roughly - differs for nested ) 
  //     body: the array of rows (or cells for nested)
  // sortRowKey:
  //   the data key to sort by (in data space, not str or aes space) 
  exports.flatStructuredTable = function(tableNode, tableData, sortRowKey) {
      
    objectSlice=function(object,fields) {
      return _.map(fields,function(k){
        return object[k]
      })
    }
    
    // Parts of the data to build csv from
    keyNames = _.keys(tableData.head.key)  
      
    sortRowAccessor = function(d){
      return d.sort
    }
    sortRowFn = function(a,b){return sortRowAccessor(a) - sortRowAccessor(b)}
      
    var table = tableNode.selectAll("table").data([tableData],function(x){return "flatStructured"})
            
    table.enter().append("table")
      .each(function(s){
        var n=d3.select(this)
        n.attr("class","data table table-bordered table-condensed")
        n.append("thead")
        n.append("tbody")
      })
      
    var head=table
      .select("thead")
      .selectAll("tr")
      .data([tableData.head]) // probably a redundant argument
            
    head.enter()
      .append("tr")
      
    head.order()
      
    head.exit().remove()  
      
    headkeys=head
      .selectAll("th.key")
      .data(function(d){return _.keys(d.key)}) // keys will be the same
      
    headkeys.enter()
      .insert("th","th.value")
      .attr("class","key")
      
    headkeys.order()
      
    headkeys.exit().remove()
      
    headkeys.text(_.identity)
      
    var cols=head
      .selectAll("th.value")
      .data(function(d){return _.keys(d.value)})
      
    cols.enter()
      .append("th").attr("class","value")
      
    cols.exit().remove()
      
    cols
      .order()
      .text(_.identity)
    
    var rows=table
      .select("tbody")
      .selectAll("tr")
      .data(tableData.body)
        
    rows.enter()
      .append("tr")
    
    rows
      .sort(sortRowFn)
      .order()
    
    rows.exit().remove()
    
    var keyCells=rows.selectAll("td.key")
      .data(function(d){
        return _.values(d.key)
      })
      
    keyCells.enter()
      .insert("td","td.value")
      .attr("class","key")
    
    keyCells
      .order()
      .text(_.identity)
      
    keyCells.exit().remove()
        
    var valueCells=rows
      .selectAll("td.value")
      .data(function(d){return _.values(d.value)})
      
    valueCells.enter()
      .append("td").attr("class","value")
      
    valueCells.exit().remove()
    
    valueCells
      .order()
      .text(_.identity)
  }
    
  // some code capable of generating a table from nested data-
  // good for wide representations of long data
  // tableNode - where in the DOM to build the table
  // tableData - the data structure of the table:
  //   list(head=..., body=...)
  //     head: the column names( roughly - differs for nested ) 
  //     body: the array of rows (or cells for nested)
  // sortRowKey:
  //   the group value to sort by.  if undefined uses the first.
  //   BUG at the moment sortRowKey is an index into the groupMembers.
  exports.nestedTable = function(tableNode, tableData, sortRowKey) {
      
    var objectSlice=function(object,fields) {
      return _.map(fields,function(k){
        return object[k]
      })
    }
    
    // get all the levels of the groups
    var groupMembers = _.uniq(_.map(tableData.body,function(x){return x.group})).sort()
    
    // Parts of the data to build csv from
    
    if(!_.isObject(tableData.head.key)) { 
      throw({message:"Tables with 'group' specified must have compound key currently.  Change plotspec grid=list(key=\"keyname\") to key=list(KeyName=\"keyname\")"})
    }
    
    var keyNames = _.keys(tableData.head.key)
    var varNames = "group"
    var valNames = "value"
      
    // get first index of array which satisfies function
    var which=function(a,f){
      return d3.range(0,a.length).filter(function(i){return f(a[i])})[0]
    }
    
    var sortRowIndex = which(groupMembers,function(g){return g==sortRowKey})
      
    if(_.isUndefined(sortRowKey)) {
      sortRowIndex=0
    }
    var sortRowAccessor = function(d){
      return _.isUndefined(d.values[sortRowIndex]) 
        ? -2^53
        : d.values[sortRowIndex].value
    }
    var sortRowFn = function(a,b){return sortRowAccessor(a) - sortRowAccessor(b)}
      
    var keySort = function(key,comparator) {
      return function (t,n){return comparator(t[key],n[key])}
    }

    // Utility functions
    // generic function which returns a specific member for
    // all arguments (equivalent to the key-as-function function)
    var memberFn=function memberFn(member){
      var f = function(x){return x[member]}
      f.toString = function(){return "function(x){return x."+member+"}"}
      return f
    }
    
    // helper function for mapping over a single data item - e.g. keys.
    var xf=function(v){return function(x){return x(v)}}

    // Take the Array of group cells and make sure they have
    // the same order and cardinality as 'groupMembers' - the
    // names of the value columns.
    var arrayToObjectByKey=function(array,key){
      return _.object(array.map(function(x){return x[key]}),array)
    }
    
    var objectToArrayByKeys=function(object,keys){
      return keys.map(function(key){return object[key]})
    }
    
    var canonicaliseArrayByKeys=function(array,key,keys){
      return objectToArrayByKeys(arrayToObjectByKey(array,key),keys)
    }
    
    var orderAndFillGroups=function(values){
      return canonicaliseArrayByKeys(values,"group",groupMembers)
    }

    // how to group data elements for the same key
    // (a row)
    var keyNester = d3.nest()
      .key(function(x){
        return _.values(x.key)
        
      })
      .sortKeys(function(a,b){ sortRowFn })
      .sortValues(keySort("group",d3.descending))
      .rollup(orderAndFillGroups)

    // how to group data into a page.  Usually this
    // is just used to select ONE page - the first.
    var pageNester = d3.nest()
      .key(function(x){return x.firstPage}) // used to get ONE fixed data item from a set.  hack for DIFF graphs like module change
      .sortKeys(d3.descending)
      .rollup(keyNester.entries)
      
    var nestData = pageNester.entries(tableData.body)
        
    var table = tableNode
      .selectAll("table")
      .data(nestData.slice(0,1), // the 0th page. a hack for the module diff table
      function(d){
        return d.key+".nested"
      })
        
    table.enter().append("table")
      .each(function(s){
        var n=d3.select(this)
        n.attr("class","data table table-bordered table-condensed")
        n.append("caption")
        n.append("thead")
        n.append("tbody")
      })
      
    table.select("caption").text(function(d){
      return d.key=="undefined"?"":d.key
    })
      
    table.exit().remove()
      
    var head=table
      .select("thead")
      .selectAll("tr")
      .data(function(d){
        // if there are no rows, don't bother printing
        // column head - we have nothing to base it on.
        return d.values.length?[d.values[0]]:[]
      })
            
    head.enter()
      .append("tr")
      
    head.order()
      
    head.exit().remove()  

    // since missing data may result in a missing cell in a row
    // we need to get the row key from the first.  This is clunky,
    // perhaps there's a better way (the zeroth element contains
    // just the key?)
    var firstDefined = function(array){
      return array.filter(function(x){return !_.isUndefined(x)})[0]
    }

    // the key columns
    var headkeys=head
      .selectAll("th.key")
      .data(function(d){
        return _.keys(firstDefined(d.values).key)
      }) // keys will be the same
      
    headkeys.enter()
      .insert("th","th.value th.info") // keys go before values and info
      .attr("class","key")
      
    headkeys.order()
      
    headkeys.exit().remove()
      
    headkeys.text(_.identity)
    
    // the key columns
    var headinfo=head
      .selectAll("th.info")
      .data(function(d){
        var firstInfo = firstDefined(d.values).info
        return firstInfo?_.keys(firstInfo):[]
      }) // keys will be the same
      
    headinfo.enter()
      .insert("th","th.value") // keys go before values and info
      .attr("class","info")
      
    headinfo.order()
      
    headinfo.exit().remove()
      
    headinfo.text(_.identity)
      
    // The value columns
    var cols=head
      .selectAll("th.value")
      .data(groupMembers,_.identity)
      
    cols.enter()
      .append("th").attr("class","value")
      
    cols.exit().remove()
      
    cols
      .order()
      .text(_.identity)
    
    // The data rows
    var rows=table
      .select("tbody")
      .selectAll("tr")
      .data(function(d){
        return d.values
      })
        
    rows.enter()
      .append("tr")
    
    rows
      .sort(sortRowFn)
      .order()
    
    rows.exit().remove()
    
    // The first N columns / cells are the key
    var keyCells=rows.selectAll("td.key")
      .data(function(d){
        // the key is stored as part of the value, so
        // we have to find a value which isn't undef
        return _.values(firstDefined(d.values).key)
      })
      
    keyCells.enter()
      .insert("td","td.info td.value") // keyCells go before values
      .attr("class","key")
    
    keyCells
      .order()
      .text(_.identity)
      
    keyCells.exit().remove()
    
    // The next N columns / cells are the optional info (unique to key) data
    var infoCells=rows.selectAll("td.info")
      .data(function(d){
        // the info is stored as part of the value, so
        // we have to find a value which isn't undef
        var firstInfo = firstDefined(d.values).info
        return firstInfo?_.values(firstInfo):[]
      })
      
    infoCells.enter()
      .insert("td","td.value") // infoCells go before values
      .attr("class","info")
    
    infoCells
      .order()
      .text(_.identity)
      
    infoCells.exit().remove()
    
    // The remaining columns are the values - each
    // value comes from a different tabledata array member,
    // in the order specified by groupMembers
    var valueCells=rows
      .selectAll("td.value")
      .data(function(d){
        return d.values
      })
      
    valueCells.enter()
      .append("td").attr("class","value")
      
    valueCells
      .order()
      .attr("width","1*")
      .text(function(d){return d?d.value:"-"})
      
    valueCells.exit().remove()
  }

})(typeof exports === 'undefined'? this['htmltable']={}: exports);
