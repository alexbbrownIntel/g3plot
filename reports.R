# Included from Server.R
# Infos are views that are all text or some sort of combination of text and plot
# handled by g3report.js


dataSummary <- function(...,dataName) {

  data=get(dataName)
  
  if (length(dim(data))!=2) stop(dataError("Dataset is not two-dimensional","UnsupportedInputData"))
  
  messageList=list()
  
  noGraphMessage <-
    list(type="text",
         name="noPlotWarning",
         text=list(class="alert",
                   value="No plot created yet - showing flat table using d3.  See plots.R for details")
    )
  
  messageList=list(noGraphMessage)
  
  tailWarningMessage <- NULL
  
  if (nrow(data) > 100) {
    data<-head(data,n=100)
    
    tailWarningMessage <-
      list(type="text",
           name="partialDataWarnings",
           text=list(class="alert",
                     value="large data truncated to 100 lines")
      )
  }
  
  tableMessage <-
    list(type="table",
         table=data,
         name="table",
         structure=setNames(names(data),names(data)),
         grid=setNames(names(data),names(data)))
  

  messageList=c(messageList,
                  list(tableMessage))
  
  if (!is.null(tailWarningMessage)) {
    messageList=c(messageList, list(tailWarningMessage))
  }

  list(type="report",
       data=I(messageList))
}