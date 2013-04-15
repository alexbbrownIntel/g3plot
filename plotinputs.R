# plotinputs adds some (reactive) UI to each plot

selectFactors = function(dataSet,fields) {
  Reduce(tagAppendChild,
         Map(
           function(field)selectInput(field,field,choices=c("All",levels(dataSet[[field]])),selected=input[[field]]),
           fields
         ),
         tags$span())  
}

diamonds_plotinput = function(...) {
  selectFactors(diamonds, c("clarity","cut","color"))
}

french_fries_plotinput = function(...) {
  tagList(
    selectInput("rep","Experiment Replicate Number",choices=unique(french_fries$rep))
  )
}

msleep_plotinput = function(...) {
  tagList(
    selectInput("order","Order",choices=c("All",unique(msleep$order)),selected=input$order),
    selectInput("genus","Genus",choices=c("All",unique(subset(msleep,order==input$order)$genus)))
  )
}

mpg_plotinput = function(...) {
  tagList(
    selectInput("manufacturer","manufacturer",choices=c("All",levels(mpg$manufacturer)),selected=input$manufacturer),
    selectInput("model","Model",choices=c("All",levels(droplevels(subset(mpg,manufacturer==input$manufacturer)$model))))
  )
}

AirPassengers_plotinput = function(...) {
  tagList(
    textInput("month1","From",value=1),
    textInput("month2","To",value=12)
  )
}

sunspots_plotinput = function(...) {
  tagList(
    textInput("startDate","start date","-6974006400000"),
    textInput("endDate","end date","439113600000")    
  )
}

iris_plotinput = function(dataName) {
  tagList(
    sliderInput("breaks", "Histogram Breaks:", 
                min = 6, max = 30, value = 8, step= 2)
  )
}

