# exception handling - make errors to pass to client a little nicer.

# Generate an exception condition that can be passed to stop or warning.
# This has an extra field - type - which can be used in exception handling
# 
dataError<-function(message="",type="G3ERRORGeneric",severity="G3UserFixable") {
  class <- c(type, "G3Error",severity,"error","condition")
  structure(list(message = as.character(message), call = sys.call(-2),
                 remediation = "Contact your local administrator",
                 type=type), 
            class = class)
}