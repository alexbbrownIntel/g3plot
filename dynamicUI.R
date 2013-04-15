# dynamicUI.R contains functions which generate UI elements in the interface
# based upon dynamic changes to the rest of the interface or data

# Generate a control to select from the runs matching the current filter
output$dataSetControls <- renderUI({
  
  dataLabels <- data()$results[,3]
  dataSetNames <- gsub(" .*","",dataLabels)
  
  druidLabels <- c("wikipedia","twitter")
  dataSetNames <- c(dataLabels, druidLabels)

  byG3 <- tapply(dataSetNames,sapply(paste0(dataSetNames,"_plot"),exists,new.env()),paste)
  
  groupedDataSets <- lapply(list(Plotted='TRUE',`Not yet`='FALSE'),function(x)byG3[[x]])
  
  if (is.null(hashParts())) return(NULL)
  hashDataSelected <- hashParts()$dataSet
  selectedDataSets <- NULL
  if (!is.null(hashDataSelected)) {
    selectedDataSets <- as.numeric(strsplit(hashDataSelected,"\\|")[[1]])
    selectedDataSets <- intersect(selectedDataSets,groupedDataSets)
  }
  if (is.null(selectedDataSets)) selectedDataSets <- unname(unlist(groupedDataSets))[1]
  selectInput2("dataSet", "Choose data set - add more by adding packages to server.R", 
               choices = groupedDataSets, multiple=FALSE,
               selected = selectedDataSets
               ,select.attrs=list(size=15));
})