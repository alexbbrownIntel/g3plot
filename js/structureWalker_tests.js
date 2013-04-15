// StructureWalker.tests

// requires node.js to be installed.
// some libraries may need to be installed at the command-line, 
// npm install underscore

// debugging tips
// insert 'debugger;' keyword where you want breakpoints
// cd WWW
// node debug structurewalker_tests.js
// c
// repl : repl allows you to query objects in scope and run js. ^c to exit repl

assert=require('assert');
var _=require('underscore');
structureWalker=require('./structureWalker').structureWalker;

// Testing MAP

// Check the provided example 1
// replacing arrays with their sizez
assert.deepEqual(structureWalker()
                 .array(_.size)
                 .map({a: [1,2], b: "alex"}),
                 {a: 2, b: "alex"});
                
// Check the provided example 2:
// indexing terminal strings into an object
assert.deepEqual(structureWalker()
                 .other(function(x){return {a: ["bob",0], b: "cheese"}[x]})
                 .map(["a", {b: "b"}]),
                 [["bob",0],{b: "cheese"}])
                 
// test example 2 using default function instead of explicit map
assert.deepEqual(structureWalker()
                 .other(function(x){return {a: ["bob",0], b: "cheese"}[x]})
                 (["a", {b: "b"}]),
                 [["bob",0],{b: "cheese"}])


// check the identity case - no transformation
assert.deepEqual(structureWalker()
                 .map([{}]),
                 [{}])

// check the empty case
assert.deepEqual(structureWalker()
                 .map(undefined),
                 undefined)

// check the simplest non-empty case
assert.deepEqual(structureWalker()
                 .map(1),
                 1)

// check the simplest array case
assert.deepEqual(structureWalker()
                 .array(_.size)
                 .map([1, 2]),
                 2);
 
// check the simplest object case

// check terminal string map stragglers get undefined
assert.deepEqual(structureWalker()
                 .other(function(x){return {}[x]})
                 .map(["a",{b: "b"}]),
                 [undefined, {b: undefined}])
                 
                
// TESTING FILTER

// note that filter functions work like this:
// 

var negate=function(f){ return function(x){return !f(x)}}
var isDefined=negate(_.isUndefined)

// simple object case
assert.deepEqual(structureWalker()
                 .filter()
                 .other(isDefined)
                 .walk({a: 1, b: undefined}),
                 {a: 1})

// simple array case
assert.deepEqual(structureWalker()
                 .filter()
                 .other(isDefined)
                 .walk(["a", undefined, "c"]),
                 ["a", "c"])

// nested array case
assert.deepEqual(structureWalker()
                 .filter()
                 .other(isDefined)
                 .walk(["a", undefined, [undefined, "c"]]),
                 ["a", ["c"]])

// nested array with empties
assert.deepEqual(structureWalker()
                 .filter()
                 .other(isDefined)
                 .walk(["a", undefined, [undefined, "c"], [undefined]]),
                 ["a", ["c"], []])


// object in array
assert.deepEqual(structureWalker()
                 .filter()
                 .other(isDefined)
                 .walk([undefined,"b",{a: 1, b: undefined}]),
                 ["b", {a: 1}])

// nested object with non after operation
assert.deepEqual(structureWalker()
                 .filter()
                 .other(isDefined)
                 .walk({a: undefined, b:{c: 1}}),
                 {b: {c: 1}})

// nested object with empties
assert.deepEqual(structureWalker()
                 .filter()
                 .other(isDefined)
                 .walk({a: undefined, b:{}}),
                 {b: {}})

// nested object with child should be partially filtered
assert.deepEqual(structureWalker()
                 .filter()
                 .other(isDefined)
                 .walk({a: undefined, b:{c: undefined, d: 1}}),
                 {b: {d: 1}})

// nested object with empties after operation
assert.deepEqual(structureWalker()
                 .filter()
                 .other(isDefined)
                 .walk({a: undefined, b:{c: undefined}}),
                 {b: {}})

// testing cleaning filter

// with objects
assert.deepEqual(structureWalker()
                 .filterClean()
                 .other(isDefined)
                 .walk({a: undefined, b:{c: undefined}}),
                 undefined)

assert.deepEqual(structureWalker()
                 .filterClean()
                 .other(isDefined)
                 .walk({a: 1, b:{c: undefined}}),
                 {a: 1})
                 
// with arrays
assert.deepEqual(structureWalker()
                 .filterClean()
                 .other(isDefined)
                 .walk([undefined, undefined]),
                 undefined)

assert.deepEqual(structureWalker()
                 .filterClean()
                 .other(isDefined)
                 .walk([undefined, [undefined]]),
                 undefined)

// check false doesn't count as defined
assert.deepEqual(structureWalker()
                 .filterClean()
                 .other(isDefined)
                 .walk([false, [undefined]]),
                 [false])

testFn = function(){}


// checking functions aren't absorbed:
assert.deepEqual(structureWalker()
                 .filterClean()
                 .other(isDefined)
                 .walk([testFn]),
                 [testFn])

assert.deepEqual(structureWalker()
                 .filterClean()
                 .other(isDefined)
                 .walk([testFn]),
                 [testFn])

assert.deepEqual(structureWalker()
                 .filterClean()
                 .other(isDefined)
                 .walk([testFn, {}]),
                 [testFn])


// convenience wrapper for undefined cleaning
assert.deepEqual(structureWalker()
                 .cleanStructure([false, [undefined]]),
                 [false])

assert.deepEqual(structureWalker()
                 .cleanStructure([undefined, [undefined]]),
                 undefined)


// TESTING filterreduce - if any true, leave structure intact.
assert.deepEqual(structureWalker()
                 .filterClean()
                 .other(function(x){return x=="A"})
                 .walk(["A", ["B"]]),
                 ["A"])

assert.deepEqual(structureWalker()
                 .filterClean()
                 .other(function(x){return x=="A"})
                 .walk(["B", ["A"]]),
                 [["A"]])

assert.deepEqual(structureWalker()
                 .filterClean()
                 .other(function(x){return x=="A"})
                 .walk(["B", ["C"]]),
                 undefined)

// Testing Co-map
assert.deepEqual(structureWalker()
                 .filterClean()
                 .other(function(x,i,c){
                   return x==c}
                   )
                 .walk("B",undefined,"B"),
                 true)

assert.deepEqual(structureWalker()
                 .filterClean()
                 .other(function(x,i,c){
                   return x==c[i]
                   
                 })
                 .walk(["alex", "b"],undefined,["alex", ["C"]]),
                 ["alex"])


assert.deepEqual(structureWalker()
                 .filterClean()
                 .preArray(function(f,x,i,c){
                   return f(x,i,_.isUndefined(i)?c:c[i])
                 })
                 .other(function(x,i,c){
                   return x==c[i]
                   
                 })
                 .walk(["alex", ["zoo"]],undefined,["alex", ["zoo"]]),
                 ["alex", ["zoo"]])



assert.deepEqual(structureWalker()
                 .filterClean()
                 .preArray(function(f,x,i,c){
                   return f(x,i,_.isUndefined(i)?c:c[i])
                 })
                 .other(function(x,i,c){
                   return x==c[i]
                   
                 })
                 .walk({name:"bob", owns:["zoo"]},undefined,{name:"bob", owns:["zoo"]}),
                 {name:"bob", owns:["zoo"]})
                 
assert.deepEqual(structureWalker()
                 .filterClean()
                 .preArray(function(f,x,i,c){
                   return f(x,i,_.isUndefined(i)?c:c[i])
                 })
                 .other(function(x,i,c){
                   return x==c[i]
                   
                 })
                 .walk({name:"alex", owns:["zoo"]},undefined,{name:"joe", owns:["zoo"]}),
                 {owns:["zoo"]})
            
assert.deepEqual(structureWalker()
                 .filterClean()
                 .preArray(function(f,x,i,c){
                   return f(x,i,_.isUndefined(i)?c:c[i])
                 })
                 .preObject(function(f,x,i,c){
                   return f(x,i,_.isUndefined(i)?c:c[i])
                 })
                 .other(function(x,i,c){
                   return x==c[i]
                   
                 })
                 .walk({name:"alex", owns:{thing: "zoo"}},undefined,{name:"joe", owns:{thing:"zoo"}}),
                 {owns:{thing: "zoo"}})
                 
// using co-map sugar
                 assert.deepEqual(structureWalker()
                 .filterClean()
                 .coMap()
                 .other(function(x,i,c){
                   return x==c[i]
                   
                 })
                 .walk({name:"alex", owns:{thing: "zoo"}},{name:"joe", owns:{thing:"zoo"}}),
                 {owns:{thing: "zoo"}})

// reduce implemented using filter
// test for ANY passing:



// TESTING REDUCE
