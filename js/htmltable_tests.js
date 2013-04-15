// htmltable.tests

// requires node.js to be installed.
// some libraries may need to be installed at the command-line, 
// npm install underscore

// jquery and d3 install requires python 2.7.  install from python.org
// windows:
// python 2.7 installer does not add python to the path - in powershell run
//  $env:PYTHON = 'C:\Program Files\Python27\python.exe' (or wherever)
// in visual C shell run
// set PYTHON=c:\Program Files\Python27\python.exe
// in MINGW run
// export PYTHON='c:\Program Files\Python27\python.exe'
// you will also need visual c++ 64-bit
//
// debugging tips
// insert 'debugger;' keyword where you want breakpoints
// cd WWW
// node debug structurewalker_tests.js
// c
// repl : repl allows you to query objects in scope and run js. ^c to exit repl

// npm install -g d3
// npm install -g jsdom
// npm install -g canvas

assert=require('assert');
var _=require('underscore');
require('d3') // if this line fails with an error involving UserAgent, then something is not installed right.

ht=require('./htmltable')

document = require("jsdom").jsdom("<html><head></head><body></body></html>");
window = document.createWindow();
navigator = window.navigator;

// flat table test
var flattable=[
  {Name:"milou",Age:2},
  {Name:"margot",Age:5}
]

