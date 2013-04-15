mkdir js_one js_min
cat `ls js/*.js | grep -v tests | grep -v min.js ` > ./js_one/g3.js
cat js_one/g3.js | ~/bin/UglifyJS/bin/uglifyjs > ./js_min/g3.min.js
