Testing and debugging
=====================

Running unit tests
==================

  * unit tests currently use assertions (not unit test framework)
  * unit tests are tested by node and require tools to be installed (see below)
  * unit tests are not currently HTML
  * unit tests are held in *_test.js files
  
Running unit tests example
--------------------------

    node structureWalker_tests.js

If it echoes nothing to the console, it worked.

Debugging JS
============

Options:

Debug in-browser
----------------

Firefox requires firebug plugin

Chrome/Safari include the webkit debugger

Testing JS
==========

Testing using node.js
---------------------

node can be debugged on the command line.  This is not fun - node-inspector is recommended.

See also: "building Node" and "node-inspector" below.

adding the statement: ``debugger;`` causes debug to break on that line

Type 'help' to get help commands
Type 'restart' to reload the js file

Common commands:
   * r: run
   * c: continue
   * n: next
   * s: step
   * repl: open a javascript console

To evaluate JS

Type 'repl' to go to a js evaluation console.  Type ^D to leave the console

Debug Tests using node.js and node-inspector
--------------------------------------------

Make sure node-inspector is installed (see Building Node and Node modules)

Running the node-debugger example:
----------------------------------

Start the node inspector:
    node-inspector 
Start node and tell it to pause at the beginning:
    node --debug-brk g3.stack_test.js

Open chrome and browse to http://127.0.0.1:8080/

Debug as you would use the webKit debugger.

https://github.com/dannycoates/node-inspector

Building Node and Node modules
==============================

Preparing
---------

On windows you can use MINGW - this comes with git for windows and with Rstudio

Install node.js
Install compile tools
  * windows: visual studio express 2012

other notes in *_test.js

To test, install node.js and the required packages:

    npm install underscore
    npm install d3
    
For in-browser debugging:
    npm install node-inspector 

On windows you will need visual studio express installed to build gyp (required by d3).

Running the tests

    cd WWW
    node structureWalker_tests.js

Unit Tests
==========

Some unit tests already exist - run them using node.
