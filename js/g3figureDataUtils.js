// g3figureDataUtils
//
// functions used for constructing or manipulating sets of data of parts of the 'model'
// usually wrappers for bits of d3 (non gui) functions

(function(exports){

  // split data into facets using new, and add convenient
  // extent data items
  // coordAesthetic is the X aesthetic if we are faceting XClusters,
  // and the Y aesthetic if we are faceting YClusters
  exports.facetData = function facetData(dataToFacet, facetAesthetic, coordAesthetic) {
    
    var stringOrStringFromObject = function(x) {
      if (_.isObject(x)) return _.values(x).join(":")
      else return x
    }    
    // Unlike in the hierarchy partition which also uses nest, we
    // simply jam all the fields together to make the key.
    var dnest=d3.nest().key(function(d) {
      return stringOrStringFromObject(d[facetAesthetic]); 
    })
      .entries(dataToFacet)
    
    var coordAccessor = function(d){return d[coordAesthetic]}
    
    // now decorate the nested entries with yscale
    _.map(dnest,function(newFacet) {
      // note that this extent value does not include rangeband padding
      newFacet.extent=d3.extent(newFacet.values,coordAccessor)
    })
  
    return dnest
  }

})(typeof exports === 'undefined'? this['g3figureDataUtils']={}: exports);
