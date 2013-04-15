cat `ls *.js | grep -v tests | grep -v min.js ` | ~/bin/UglifyJS/bin/uglifyjs > g3.min.js
