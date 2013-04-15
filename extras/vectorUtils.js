// javascript functions

function vectorUtils() {

  var vu={}

  vu.member=function(member){
    return function(x){return x[member]}
  }
  
  vu.slice=function(members){
    // should delegate to Array version for arrays
    return function(object){
      return _.map(members,function(x){return object[x]})
    }
  }
  
  vu.objectArrayToObjectF=function(key,value) {
    return function(array) {
      return _.object(_.pluck(array,key),_.pluck(array,value))
    }
  }
  
  // this doesn't quite belong here:
  d3.nest().key(function(x){return x.checkpoint})
    .rollup(objectArrayToObjectF("counter","cycles"))
    .entries(records)
  
}

vu=vectorUtils();
