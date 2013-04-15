// Utility method to recursively walk a data structure and apply a different function 
// to each of array, object and other (usually a number or character)
// used for data mapping and transformation.
// Public Domain (by AlexBBrown)

// has tests in structureWalker_tests.js

// Usage:
//
// structureWalker() // constructor
//   .object(someFn) // optional - defaults to recurse
//   .array(someFn) // optional - defaults to recurse
//   .other(someFn) // optional - defaults to identity
//   (structureToWalk) // go!
//
// Examples
// to count the length of arrays in an object:
// 
// structureWalker().array(_.size)({a: [1,2], b: "alex"})
//   -> {a: 2, b: "alex"}
//
// to map one datastructure into another:
//
// structureWalker().other(function(x){return {a: ["bob",0], b: "cheese"}[x]})(["a", {b: "b"}])
//   -> [["bob",0],{b: "cheese"}]
//

(function(exports){
  
  if (typeof require !== 'undefined') {_=require('underscore');}

  // Walk a structure composed of objects arrays and elements, and apply
  // one of the functions on each type.  Specify recurse to continue walking into
  // the object.
  exports.structureWalker = function() {
        
    // The I combinator
    function identityF() { return function identity(x){return x} }
    
    // utility for consumers of structureWalker
    identity = identityF();
    
    // Apply a different function depending upon the type of the argument:
    // Object/Array/Other.  Treats this as an argument to pass on.
    // relies on caller invoking returned function using:
    // applyObjectArrayOtherF.call(context,a,b,c) to load this properly
    function applyObjectArrayOtherF(objF, arrayF, otherF) { 
      return function applyObjectArrayOther(val,iterator,context) {
      // map context is passed in as this
      return (_.isArray(val) ? arrayF:
                 _.isFunction(val) ? otherF:
                 _.isObject(val) ? objF:
                   otherF)(val,iterator,context);
    }}
    
    // Fallback map function if explicit object function is not provided:
    // recurses on every value of the object,  and return
    // the object constructed out of the results with the same keys
    function mapObjectF(f) { return function mapObject(obj,iterator,context) {
      return _.object(_.keys(obj), _.map(obj, f, context));
    }}

    function filterWrap(f) {
      return function(x,iterator) {
        var context=this
        var res=f(x,iterator,context)
        return res ? _.isObject(res) ? res : x : undefined
      }
    }

    function cloneDefinedProperties(object) {
      return _.pick(object,_(object).keys().filter(function(maplet){return defined(object[maplet])}))
    }

    // Fallback filter function is explicit object function is not provided:
    // takes a function which includes or excludes the object as a whole.
    // if the default function is used, then the maplet inclusion test
    // is applied to each.  if no maplet function is supplied, then 
    // the value function is used instead, and will exclude the maplet.
    function filterObjectF(f) {  return function mapObject(obj, iterator, context) {
      // maplet picker
      return cloneDefinedProperties(mapObjectF(filterWrap(f))(obj, iterator, context))
    }}

    
    // Fallback map function if explicit array function is not provided:
    function mapArrayF(f) { return function mapArray(obj,iterator,context) {
      return _.map(obj, f,context);
    }}    
    
    function defined(x) {
      return !_.isUndefined(x)
    }
    
    // Fallback filter function if explicit array function is not provided:
    function filterArrayF(f) { return function mapArray(array,iterator,context) {
      // first run the map and then eliminate undefined elements.
      return _.filter(_.map(array, filterWrap(f),context),defined);
    }}
    
    var mapValueF = identityF; // is this used?
    
    function filterValueF(f) { return function filterValue(value,iterator,context) {
      return f(value,iterator,context)?value:undefined; 
    }}
  
    // The K combinator.  Probably want to export this.
    function constantlyF(val) { return function constantly() { return val }}
    
    var objectFn = mapObjectF(walk),
        arrayFn = mapArrayF(walk),
        otherFn = identity;
    
    // reset the default functions to the filter ones
    function filter() {
      objectFn = filterObjectF(walk),
      arrayFn = filterArrayF(walk), // will fix later
      otherFn = identity
      return this;
    }
    
    function filterClean() {
      return this.filter()
        .postArray(this.cleanEmptyArray)
        .postObject(this.cleanEmptyObject)
    }
    
    // Co-map causes the context to be iterated over 
    // in lock-step with the primary structure.
    // Note that this cannot be undone, and should be 
    // done AFTER setting the object/array etc functions
    function coMap() {
      return this
        .preArray(function(f,x,i,c){
          return f(x,i,i?c[i]:c)
        })
        .preObject(function(f,x,i,c){
          return f(x,i,i?c[i]:c)
        })
    }
    
    function walk(structure,iterator,context) {
      if (arguments.length==2) {
        context=iterator;
        iterator=undefined;
      }
      return applyObjectArrayOtherF(
        objectFn,arrayFn,otherFn)(structure,iterator,context);
    }
    
    walk.map = walk;
    
    walk.walk = walk;
    
    walk.filter = filter;
    
    walk.filterClean = filterClean;
    
    walk.coMap = coMap;
    
    walk.object = function(newObjectFn) {
      objectFn = newObjectFn;
      return walk;
    }

    walk.postObject = function(postObjectFn) {
      var oldObjectFn = objectFn
      objectFn = function(x,i,c){return postObjectFn(oldObjectFn(x,i,c))}
      return walk;
    }
    
    walk.preObject = function(preObjectFn) {
      var oldObjectFn = objectFn
      objectFn = function(x,i,c){return preObjectFn(oldObjectFn,x,i,c)}
      return walk;
    }

    walk.array = function(newArrayFn) {
      arrayFn = newArrayFn;
      return walk;
    }
    
    walk.postArray = function(postArrayFn) {
      var oldArrayFn = arrayFn
      arrayFn = function(x,i,c){return postArrayFn(oldArrayFn(x,i,c))}
      return walk;
    }
    
    walk.preArray = function(preArrayFn) {
      var oldArrayFn = arrayFn
      arrayFn = function(x,i,c){return preArrayFn(oldArrayFn,x,i,c)}
      return walk;
    }
    
    walk.other = function(newOtherFn) {
      otherFn = newOtherFn;
      return walk;
    }
    
    // Utility functions:
    // Extract data at a path in an object
    walk.atPath = function(structure){ return function(path) {
      return _.reduce(path,function(structure,member){return structure[member]},structure)
    }}
    
    walk.memberOf = function(thing){ return function(member) {
      return thing[member]
    }}
    
    walk.membersOf = function(thing){ return function(member) {
      return _.isArray(thing)?_.pluck(thing,member):thing[member]
    }}
    
    walk.indexedMemberOf = function(thing,index){ return function(member) {
      return thing[member][index]
    }}
  
    walk.cleanEmptyArray = function(thing){ 
      return thing.length==0?undefined:thing
    }
    
    walk.cleanEmptyObject = function(thing){
      return _.keys(thing).length==0?undefined:thing
    }
    
    walk.cleanStructure = function(structure) {
      return this
        .filterClean()
        .other(defined)
        .walk(structure)
    }
  
    return walk;
  }

})(typeof exports === 'undefined'? this['structureWalker']={}: exports);
