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


})(typeof exports === 'undefined'? this['g3functional']={}: exports);
