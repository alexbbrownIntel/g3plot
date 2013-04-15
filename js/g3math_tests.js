assert=require('assert');

g3math=require('./g3math')

console.log("Testing g3math")

var a1 = [0,1]

console.log("Testing grow")

assert.deepEqual(g3math.grow2(1.00,a1),a1);
assert.deepEqual(g3math.grow2(0.00,a1),[0.5,0.5]);
assert.deepEqual(g3math.diff(g3math.grow2(0.00,a1)),0);
assert.deepEqual(g3math.grow2(2.00,a1),[-0.5,1.5]);
assert.deepEqual(g3math.diff(a1)*2,g3math.diff([-0.5,1.5]));
assert.deepEqual(g3math.diff(g3math.grow2(2.00,a1)),g3math.diff([-0.5,1.5]));
assert.deepEqual(g3math.grow2(0.50,a1),[0.25,0.75]);

console.log("Testing ungrow - should exactly invert grow (for reversible grows)")

assert.deepEqual(g3math.ungrow2(1.00,a1),a1);
assert.equal(NaN.toString(),'NaN')
assert.equal(g3math.ungrow2(0.00,[0.5,0.5]).toString(),[NaN,NaN].toString());  // 0/0 = NaN, but NaN != NaN but 'NaN'=='NaN'.
//assert.deepEqual(g3math.diff(g3math.grow2(0.00,a1)),0);
assert.deepEqual(g3math.ungrow2(2.00,[-0.5,1.5]),a1);
//assert.deepEqual(g3math.diff(a1)*2,g3math.diff([-0.5,1.5]));
assert.deepEqual(g3math.diff(g3math.ungrow2(2.00,[-0.5,1.5])),g3math.diff(a1));
assert.deepEqual(g3math.ungrow2(0.50,[0.25,0.75]),a1);

/*
assert.deepEqual(g3math.shrink2(1.00,a1),a1);
assert.deepEqual(g3math.shrink2(2.00,a1),[0.25,0.75]);
assert.deepEqual(g3math.shrink2(0.50,a1),[-0.5,1.5]);
*/
[0.5,1.00,2.00].map(function(scale) {
//  assert.equal(scale*g3math.diff2(g3math.shrink2(scale,a1)),g3math.diff2(a1));
  assert.equal(g3math.diff2(g3math.grow2(scale,a1)),scale*g3math.diff2(a1));
})

assert.deepEqual(g3math.ungrow2(1.0,g3math.grow2(1.0,a1)),a1);
assert.deepEqual(g3math.ungrow2(0.0,g3math.grow2(0.0,a1)).toString(),[NaN,NaN].toString());

assert.deepEqual(g3math.ungrow2(2.0,g3math.grow2(2.0,a1)),a1);
assert.deepEqual(g3math.ungrow2(1.0,g3math.grow2(1.0,a1)),a1);
assert.deepEqual(g3math.ungrow2(0.5,g3math.grow2(0.5,a1)),a1);

console.log("Testing zoom")

var a1mean = (a1[0]+a1[1])/2

// testing zoom as grow (center is mean)
assert.deepEqual(g3math.unzoom2(1.00,a1mean,a1),a1);
assert.deepEqual(g3math.unzoom2(0.00,a1mean,a1),[0.5,0.5]);
assert.deepEqual(g3math.diff(g3math.unzoom2(0.00,a1mean,a1)),0);
assert.deepEqual(g3math.unzoom2(2.00,a1mean,a1),[-0.5,1.5]);
assert.deepEqual(g3math.diff(g3math.unzoom2(2.00,a1mean,a1)),g3math.diff([-0.5,1.5]));
assert.deepEqual(g3math.unzoom2(0.50,a1mean,a1),[0.25,0.75]);

var origin = 0

// testing zoom around origin
assert.deepEqual(g3math.unzoom2(1.00,origin,a1),a1);
assert.deepEqual(g3math.unzoom2(0.00,origin,a1),[0.0,0.0]);
assert.deepEqual(g3math.diff(g3math.unzoom2(0.00,origin,a1)),0);
assert.deepEqual(g3math.unzoom2(2.00,origin,a1),[0.0,2.0]);
assert.deepEqual(g3math.diff(g3math.unzoom2(2.00,origin,a1)),g3math.diff([0.0,2.0]));
assert.deepEqual(g3math.unzoom2(0.50,origin,a1),[0.0,0.5]);



console.log("End testing g3math")
