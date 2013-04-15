// AestheticUtils.tests

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
structureWalker=require('./structureWalker');
aestheticUtils=require('./aestheticUtils');

// Tiny data set
records = [{Name:"Alex", Age:39}]

// Test ApplyAesthetic

// Test basic functionality
assert.deepEqual(aestheticUtils
                 .applyAesthetic
                 ({X:"Name",Y:"Age"})
                 (records[0]),
                 {X:"Alex",Y:39});
                 
// Nested data set for addressing / fetching objects
recordsN = [{Species:{Order:"Animal",Species:"Wolf"}, Bite:4}];

// Test fetch of whole object
assert.deepEqual(aestheticUtils
                 .applyAesthetic
                 ({XCluster:"Species",Y:"Bite"})
                 (recordsN[0]),
                 {XCluster:{Order:"Animal",Species:"Wolf"},Y:4});
                 
// Test fetch of leaf by list path access
assert.deepEqual(aestheticUtils
                 .applyAesthetic
                 ({X:["Species","Species"],Y:"Bite"})
                 (recordsN[0]),
                 {X:"Wolf",Y:4});
                 
