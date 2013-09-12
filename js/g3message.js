// g3message handles the message syntax and content, and transforms it into the internal representation

(function(exports){

  // fill in missing parts of the message
  setPlotDefaults = function(result) {
    // TODO: do defaults (such as dimensions)
    return(result)
  }

  // generate col major structured records - by 'layer'    
  processLayer = function(layer_message) {

    // TODO: don't handle dates like this - handle them by SCALES instead.
    if(layer_message.data.timestamp)
      layer_message.data.timestamp = layer_message.data.timestamp.map(function(x){return new Date(+x)})

    var strData = aestheticUtils.decodeData(layer_message);
    
    // TODO: raise errors if the aes or structure is not satisfiable
    
    // create records with fields x,y,group from data
    var aesData = strData.map(aestheticUtils.applyAesthetic(layer_message.aesthetic))
    // derive effective structure of aesthetic
    var aesStructure = aestheticUtils.applyAesthetic(layer_message.aesthetic)(layer_message.structure)
    
    // attach layer by reference to each node
    _.forEach(aesData,function(a){a.layer=layer_message})
    
    return {error: undefined,
            data: {message: layer_message, // TODO: drop the message
                   structured: strData, // TODO: drop the strData
                   aesthetic: aesData
                   },
            metaData: {aestheticStructure: aesStructure},
            name: layer_message.name
    }
  }

  exports.loadMessage = function(el,naive_message) {
    // TODO: remove el argument!

    // The starting state for a graph is a simple XML structure (OR the old structure inherited from the old graph!)
    // <svg><g.plot/><g.xaxis/><g.yaxis/><g.brush/></svg>
    // see g3widget.html for full details.
  
    //
    // The data
    //
    
    // The input message consists of a number of parameters, including
    // table: the input data data with original (ish) names
    // aes: the aesthetic mapping of X, Y onto the data (for this graph)
    //   note: aes contains X and Y; numeric scaled x and y (lowercase) are created later
    // scales: scale types (hierarchical, log, ordinal, linear)
    // ... and others
        
    var message = g3message.validate(naive_message)
    
    var layers = _.map(message.layers,processLayer)
    
    var result = {error: undefined,
            name: message.name,
            data: {message: message}, // TODO: clean this up - message at top?
            layers: layers
    }
    
    result = setPlotDefaults(result)
        
    return(result)
  }

  // tune up the inbound message so it doesn't explode g3figure
  // or explode here.  This could also be done in R, but why not?
  exports.validate=function validate(M) {
    
    if(M.layers==undefined) throw({message: "Missing layers in message from server"})
    
    //if(M.table==undefined) throw({message:"Missing data in message from server"})

    // should clone M so it's still available for debugging
    
    if (!M.labels) {
      // should use aestheticStructure here
      M.labels = {x:"X",y:"Y"}
    }
    
    if (!M.scales) M.scales = {}
        
    return M
  }

})(typeof exports === 'undefined'? this['g3message']={}: exports);



