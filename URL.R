#
# URL Control ----------------------------------------------------
# 

urlHashFirstTime <- T

# Update the URL hash in the browser.
#
# This serves two purposes:
# * Creates an encoded URL which can be shared to another user
# * Helps consume an encoded URL entered explicitly in the URL bar
# PLUS
# * It may be helpful in mapping old field names to new ones when the
#   set of bookmarkable field names change, e.g. from YourApp 1.0
#   to 2.0 'uid' may become 'user' and we want to fix that on old 
#   bookmarked URLs.
#
# Note: this function is terribly delicate because it's got some potential race conditions
# and triggers javascript in the browser.
#
# Intended sequence of events on new URL entered in browser.
# NOTE: editing a browser URL may not trigger this code because by default browsers do not
# reload the page on URL hash change
#
# Important consideration: the browser side javascript is only triggered if the output$hash
# is different from the input$hash (this is browser behaviour).  In addition, g3plot 
# treats the first different hash it receives specially - it uses it to populate the client
# input fields.  It ignores all subsequent changes (but does tell the browser URL bar)!
# This avoids nasty cycles but it means that if we want to carefully consider when to send
# the first 'different' value to the browser, to ensure 1) it is actually capable of filling
# in the fields (some fields are dynamically generated late in the game) 2) we do actually
# eventually send one, otherwise the user will experience the bookmarks not working.
# 
# The following list of events is part wishful thinking and part experiment:
#
# 1. User enters saved URL in browser bar
# 2. Shiny server starts up
# 3. Default page delivered to client with default values
# 4. Client records browser hash and copies it to input$hash
# TIME1. output$hash function called (TIME1)
#  inputs: hash is correct, static inputs are default, reactive inputs are missing
#  T1.1 output$hash reads all input url_fields_to_sync.  This informs shiny server
#   that it should be informed in future about changes to these inputs.  Note that
#   output$hash does not want to hear about updates to the hash itself, so it
#   'isolates' accesses to this value.  This hopefully avoids unpleasant cycles
#  T1.2 output$hash checks to see if a probe field exists in the input.  This is important
#   if synchronised fields are generated as part of reactiveUI - the input may not
#   yet exist from shiny's point of view, so there is no way to fill it in from
#   the browser side. (There may be a way to fill it in from the client though).
#   Should check this - perhaps the actual hashparts function should perform the
#   upgrade (see above)
#  T1.2.1 If the probe field does not exist, just send a copy of the current input hash
#   back
#  T1.3 The browser gets output$hash.  and calls renderValue
#   It's the same as the original, but doesn't check for that.
#   we note it's the first time it's called, then update the static fields
#   from the correct hash.
# NO! it's not quite the same, it added a #! OK this time it IS the same (both #)

#  T1.4 the browser updates the fields it has from the URL, but not the reactive fields
#   which are not yet present.
#
# INTERLUDE1 - Tumbleweeds
#  I1.1 Shiny server updates the 'reactive' values, filling in data from the hash
#   oops.  This is how reactive values get filled in. Not by the update mechanism
#  I1.2 Shiny server finishes sending the 'reactive' UI to the client (hope it's all
#   in one go!.
#  I1.3 Shiny browser client notes that new inputs exist, and tells the server.
#   Since output$hash is registered for those inputs, it gets invoked:
# TIME2: output$hash is called (TIME2)
#  inputs: hash is correct, static inputs are correct, reactive inputs are correct
#  T2.1 output$hash constructs a temporary hash value from current inputs (these inputs
#   will be the default inputs - not the fancy bookmarked ones!  we don't use them
#   yet. NO THEY AREN'T : all inputs are correct by now.
#  T2.2 output$hash checks to see if a probe field exists in the input. It does.
#  T2.3 output$hash notes that this is the first time we got here with a valid probe.
#  T2.4 output$hash knows it's too soon to update the URL. it returns the input URL.
#  T2.5 Shiny server notes that the output value is the SAME as last time, and
#    doesn't bother sending it to the client.
# OK now i'm confused.  has the browser already consumed them?
# note: Always (wrongly) adds a preceding # to the hash.  the browser discards it,
# but it seems to help - it's considered a new value (even if the rest hasn't changed)
# 2.14. browser gets new hash but it's the same, so the hash change handler is not 
# called.?  this doesn't seem right.
# TIME3: output$hash called.  I don't know why.
#   T3.1 reads inputs, builds a new hash.  foolishly omits the preceding #.
#   T3.2 sends it to the browser
#   T3.3 it's not really different, but it has that preceding hash
#   T3.4 javascript code see's it not the first update, so it ignores it
# WOW this code is a set of beautifully interlocking bugs.
output$hash <- renderText({
  
  enHash <- function(fieldNames,hash) {
    paste0("#",paste(collapse=",",
                     Map(function(field) {
                       fieldValue = hash[[field]]
                       if (length(fieldValue)==0 || is.na(fieldValue)) fieldValue=""
                       paste(sep="=",
                             field,
                             paste(collapse="|",Map(URLencode,as.character(fieldValue)
                             )))
                     },
                         fieldNames)))
  }
  
  # WARNING: we must always do the encode here in order to register all the
  # inputs fields with the reactive framework.  Do not refactor this request
  # below the 'if's:
  
  newHash <- enHash(url_fields_to_sync, input)
  
  # end WARNING.
  
  # the probe field is a field that only exists in your reactive UI.
  # if you have any, otherwise make it NULL
  probe_field <- NULL
  
  # wait for the reactive UI to build run_base
  if (!is.null(probe_field) && is.null(input[[probe_field]])) {
    # return the _identical_ hash to the client.
    return(isolate(input$hash))
  }
  
  # the VERY FIRST time passes the original hash up.
  # do we need this as well as the wait above?
  return(
    if (!urlHashFirstTime) {
      newHash
    } else {
      if (is.null(input$hash)) {
        NULL
      } else {
        urlHashFirstTime<<-F;
        
        isolate(input$hash)
      }
    }
  )
})

hashParts <- function() {
  hash <- isolate(input$hash)
  if (nchar(hash)<=1) return(list())
  
  x<-Map(strsplit,
         strsplit(substring(hash,2),","),"=")[[1]]
  xmap <- setNames(Map(`[`,x,2),
                   Map(`[`,x,1))
  xmap <- lapply(xmap,function(x)if(is.na(x))""else x)
  lapply(xmap, URLdecode)
}
