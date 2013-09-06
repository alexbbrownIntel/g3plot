(function(exports){


  // decode an input data set from a message in a 
  // well-known form.
  exports.decodeData = function decodeData(message) {
  
    var structure = message.structure;
    var recordWalker=structureWalker.structureWalker(); // a new walker
  
    // transform the column-major data set (object of arrays)
    // and returns a set of structured records according to structure
    // for a particular index:
    function buildRecord(index){ 
      return recordWalker.other(
        // for each string S in structure, pull out the indexed element
        // of the array named S in data.
        recordWalker.indexedMemberOf(message.data,index))(structure);
    }
    // the number of records:
    var recordCount = _.values(message.data)[0].length
    // use the walker to map the structure onto the data
    var records = d3.range(0,recordCount).map(buildRecord)
    
    return records;
  }
  
  // Apply an aesthetic map to a data structure, matching, X, Y etc to
  // named fields.
  exports.applyAesthetic = function applyAesthetic(aesthetic) { return function(record) {
    // aesthetic is like structure, but it queries structure
    aesWalker = structureWalker.structureWalker()
     
    return aesWalker.array(
      // for each aesthetic, find the corresponding data item by 
      // dereference path in the data.
      aesWalker.atPath(record)
      )
      .other(
      // for simple strings, the path is simple:
      aesWalker.membersOf(record)
      )(aesthetic)
  }}
  
  // build a filter function from a map from structure names to the functions
  // that they filter, e.g. {ipc:function(ipc){return ipc>10}}
  // and an aesthetic map from the current data set to the original structure, e.g.
  // {Y:"ipc"}
  exports.filterFromFilterSpec = function filterFromFilterSpec(filterSpec, aesMap) {
    var aesFilterSpec = structureWalker.structureWalker().cleanStructure(aestheticUtils.applyAesthetic(aesMap)(filterSpec)) // the filter spec with names replaced by table names
    // a filterSpec that contains no functions will be undefined.
    if (_.isUndefined(aesFilterSpec)) { return function(){return true}}
    
    var filterWalker = structureWalker.structureWalker()
      .filterClean() // throws away false primitives dna empty records and arrays in the result
      .other(function(f,i,c){
        return !f(c[i]) // false if it matches
      })
      .coMap()
    
    return function(record){
      // if any tests failed, they remain in the output.
      return _.isUndefined(filterWalker.walk(aesFilterSpec,record))
    }    
  }
  
  // utilities - shouldn't be here really since it's about the concrete plan containing aesthetics.
  
  // returns length of (first?) valid aesthetic or undefined if none
  exports.hasAesthetic = function hasAesthetic(plan,aesthetic) {
    // look in global aesthetic structure first
    var aesthetics = []
    if (plan.metaData && plan.aestheticStructure && plan.metaData.aestheticStructure[aesthetic]) {
      aesthetics.push(plan.metaData.aestheticStructure[aesthetic])
    }
    // look in local aesthetic next
    _.map(plan.layers,function(l){
      if (l.metaData.aestheticStructure[aesthetic]) {
        aesthetics.push(l.metaData.aestheticStructure[aesthetic])         
      }
    })
    // return the length of the olength of the first aesthetic (or 1 for atomics or objects)
    return _.isObject(aesthetics[1]) ?
      _.keys(aesthetics[1]).length : !_.isUndefined(aesthetics[1])
  }

})(typeof exports === 'undefined'? this['aestheticUtils']={}: exports);
