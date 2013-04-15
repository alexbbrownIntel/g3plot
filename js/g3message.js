// g3message handles the message syntax and content, and transforms it into the internal representation

(function(exports){

  exports.loadMessage = function(el,naive_message) {
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
        
    if(message.table.timestamp)
      message.table.timestamp = message.table.timestamp.map(function(x){return new Date(+x)})
        
    // generate col major structured records
    var strData = aestheticUtils.decodeData(message);
    
    // create records with fields x,y,group from data
    var aesData = strData.map(aestheticUtils.applyAesthetic(message.aesthetic))
    // derive effective structure of aesthetic
    var aesStructure = aestheticUtils.applyAesthetic(message.aesthetic)(message.structure)
    
    return {error: undefined,
            data: {message: message, // TODO: drop the message
                   structured: strData,
                   aesthetic: aesData
                   },
            metaData: {aestheticStructure: aesStructure},
            name: message.name
    }
  }

  // tune up the inbound message so it doesn't explode g3figure
  // or explode here.  This could also be done in R, but why not?
  exports.validate=function validate(M) {
    
    if(M.table==undefined) throw({message:"Missing data in message from server"})

    // should clone M so it's still available for debugging
    
    if (!M.labels) {
      // should use aestheticStructure here
      M.labels = {x:"X",y:"Y"}
    }
    
    if (!M.scales) M.scales = {}
        
    return M
  }

})(typeof exports === 'undefined'? this['g3message']={}: exports);



