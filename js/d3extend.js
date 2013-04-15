// Portions of this file are licenced under the terms in the file NOTICE in this package

// Extensions or replacements for d3 functions which don't quite fit g3figure's needs
(function(exports){
  
  // the following code is a verbatim extract (apart from the function assigment)
  // https://github.com/mbostock/d3/blob/master/src/layout/hierarchy.js
  // required to rebind partition2 below into d3.
  exports.hierarchy = function() {
    var sort = d3_layout_hierarchySort,
        children = d3_layout_hierarchyChildren,
        value = d3_layout_hierarchyValue;
  
    // Recursively compute the node depth and value.
    // Also converts to a standard hierarchy structure.
    function recurse(node, depth, nodes) {
      var childs = children.call(hierarchy, node, depth);
      node.depth = depth;
      nodes.push(node);
      if (childs && (n = childs.length)) {
        var padding = 0; // padding needs to be in pixels, sadly.

        var i = -1,
            n,
            c = node.children = [],
            v = padding,
            j = depth + 1,
            d;
        while (++i < n) {
          d = recurse(childs[i], j, nodes);
          d.parent = node;
          c.push(d);
          v += d.value;
        }
        // allows some depths to return unvalues.
        if (v == 0) v = +value.call(hierarchy, node, depth) || 0;
        if (sort) c.sort(sort);
        v += padding;
        if (value) node.value = v;
      } else if (value) {
        node.value = +value.call(hierarchy, node, depth) || 0;
      }
      return node;
    }
  
    // Recursively re-evaluates the node value.
    function revalue(node, depth) {
      var children = node.children,
          v = 0;
      if (children && (n = children.length)) {
        var i = -1,
            n,
            j = depth + 1;
        while (++i < n) v += revalue(children[i], j);
      } else if (value) {
        v = +value.call(hierarchy, node, depth) || 0;
      }
      if (value) node.value = v;
      return v;
    }
  
    function hierarchy(d) {
      var nodes = [];
      recurse(d, 0, nodes);
      return nodes;
    }
  
    hierarchy.sort = function(x) {
      if (!arguments.length) return sort;
      sort = x;
      return hierarchy;
    };
  
    hierarchy.children = function(x) {
      if (!arguments.length) return children;
      children = x;
      return hierarchy;
    };
  
    hierarchy.value = function(x) {
      if (!arguments.length) return value;
      value = x;
      return hierarchy;
    };
  
    // Re-evaluates the `value` property for the specified hierarchy.
    hierarchy.revalue = function(root) {
      revalue(root, 0);
      return root;
    };
  
    return hierarchy;
  };
  
  // A method assignment helper for hierarchy subclasses.
  function d3_layout_hierarchyRebind(object, hierarchy) {
    d3.rebind(object, hierarchy, "sort", "children", "value");
  
    // Add an alias for nodes and links, for convenience.
    object.nodes = object;
    object.links = d3_layout_hierarchyLinks;
  
    return object;
  }
  
  function d3_layout_hierarchyChildren(d) {
    return d.children;
  }
  
  function d3_layout_hierarchyValue(d) {
    return d.value;
  }
  
  function d3_layout_hierarchySort(a, b) {
    return b.value - a.value;
  }
  
  // Returns an array source+target objects for the specified nodes.
  function d3_layout_hierarchyLinks(nodes) {
    return d3.merge(nodes.map(function(parent) {
      return (parent.children || []).map(function(child) {
        return {source: parent, target: child};
      });
    }));
  }
  
  // the following code is a modified copy of
  // https://github.com/mbostock/d3/blob/master/src/layout/partition.js
  // tweaked to allow the following:
  // termination at an arbitrary level
  // overridden value at depth n
  // padding options
  exports.partition2 = function() {
    var hierarchy = d3extend.hierarchy(),
        size = [1, 1]; // width, height
  
    function position(node, x, dx, dy) {
      padding = node.depth==1?0:0 // this sort of works but it's not good for prime-time yet.
      var children = node.children;
      node.x = x;
      node.y = node.depth * dy;
      node.dx = dx;
      node.dy = dy;
      if (children && (n = children.length)) {
        var i = -1,
            n,
            c,
            d;
        dx = node.value ? (dx - padding) / node.value : 0;
        while (++i < n) {
          position(c = children[i], x + padding / 2, d = c.value * dx, dy);
          x += d;
        }
      }
    }
  
    function depth(node) {
      var children = node.children,
          d = 0;
      if (children && (n = children.length)) {
        var i = -1,
            n;
        while (++i < n) d = Math.max(d, depth(children[i]));
      }
      return 1 + d;
    }
  
    function partition(d, i) {
      var nodes = hierarchy.call(this, d, i);
      position(nodes[0], 0, size[0], size[1] / depth(nodes[0]));
      return nodes;
    }
  
    partition.size = function(x) {
      if (!arguments.length) return size;
      size = x;
      return partition;
    };
  
    return d3_layout_hierarchyRebind(partition, hierarchy);
  };
  
})(typeof exports === 'undefined'? this['d3extend']={}: exports);
