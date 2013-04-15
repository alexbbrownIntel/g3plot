(function(exports){

    // grow2 expand range by p %, around center.
    exports.grow2 = function grow2(p,x) {
      return exports.unzoom2(p,(x[1]+x[0])/2,x)
    }
    // ungrow2 reverse grow2 operation
    exports.ungrow2 = function ungrow2(p,x) {
      return exports.grow2(1/p,x)
    }
    // convenient name for it
    exports.contract2 = exports.ungrow2
    
    exports.unzoom2 = function zoom(p,c,x) {
       return [c+(x[0]-c)*p,
               c+(x[1]-c)*p]
    }
    
    exports.zoom2 = function zoom2(p,c,x) {
      return exports.unzoom2(1/p,c,x)
    }
    
    exports.inRangeF = function inRangeF(range) { return function(value) {
      return value >= range[0] && value <= range[1];
    }}
    
    exports.overlapRangeF = function overlapRangeF(range1) { return function(range2) {
      return range1[0] <= range2[1] && range1[1] >= range2[0];
    }}
    
    exports.diff2=function(x){return x[1]-x[0]}

    exports.diff=exports.diff2

})(typeof exports === 'undefined'? this['g3math']={}: exports);
