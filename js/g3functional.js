(function(exports){
  
  exports.constantly = function constantly(value) { return function() { return value } }
  
  exports.identity = function identity(x) { return x } // could use _.identity
  
  exports.repeatedly = function repeatedlyFn(a) {
    var v=a,i=0,l=a.length;
    return function repeatedly() { return v[i=(1+i)%l] }
  }
  
  // using an arbitrary accessor as the next pointer, return the list thus formed from the input node
  exports.followChain=function(accessor){
    var followChainAccessor = function(node) {    
      var chain;
      return (typeof(node[accessor])==="undefined")
        ?[node]
        :(chain=followChainAccessor(node[accessor]),chain.push(node),chain)
    }
    return followChainAccessor
  }
  
  // other utilities
  exports.pluralise = function(x){return typeof(x)==="undefined"?[]:_.isArray(x)?x:[x]}

  // convert an array of objects to an object of arrays [{a:1},{a:2}] => {a:[1,2]}
  // unused so far - just handy
  var twoargs=function(f){return function(x,y){return f(x,y)}}
  exports.objectArraysToArrayObjects=function(d){return (function(k){return _.object(k,_.map(k,function(x){return _.pluck(d,x)}))})(_.chain(d).map(_.keys).reduce(twoargs(_.unique)).value())}

})(typeof exports === 'undefined'? this['g3functional']={}: exports);
