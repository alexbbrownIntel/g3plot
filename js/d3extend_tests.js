// d3extend_tests

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
d3=require('d3');
d3extend=require('./d3extend');

var tinytree = {children:[{value:1},{value:2},{value:3}]}

var tinytree = {children:[{h:1,v:1},{h:2,v:2},{h:3,v:3}]}

var tinytree = {children:[1,2,3]}

var mediumtree = {children:[tinytree,tinytree]}

unbalancedtree = {children:[{children:[{},{}]},{children:[{}]},{children:[{}]}]}

// note that these can fail if padding is hard coded to (not zero)

assert.deepEqual(_.pluck(d3extend
                 .partition2()
                 .value(function(n,dep){
                   return((dep>=2)?0:1)
                 })  
                 .sort(null)
                 .size([120, 120])
                 .nodes(unbalancedtree),"dx"),
                 [120,40,0,0,40,0,40,0]) // this is what i WANT - seems to work

assert.deepEqual(_.pluck(d3extend
                 .partition2()
                 .value(function(n,dep){
                   return((dep>=2)?0:1)
                 })  
                 .sort(null)
                 .size([120, 120])
                 .nodes(unbalancedtree),"x"),
                 [0,0,0,0,40,40,80,80]) // this is what i WANT - not sure whats on.

