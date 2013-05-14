# This code is the STATIC UI only - uploads the 
# skeleton of the web page.

require(shiny);

# options(error = recover);

source("shiny_extend_g3.R")

static_links=list(`Github for g3plot`="https://github.com/alexbbrown/g3plot-1",
                  `Shiny`="http://shiny.rstudio.org",
                  `D3`="http://d3js.org",
                  `Google Groups`="http://groups.google.com/group/shiny-discuss")

# depends means the server restarts if one of these files is touched and 
# the browser is refreshed.  In Theory - but sometimes it seems like it's not working.
lapply(Sys.glob(c("*.R","*.js","js/*.js")),
       shiny:::dependsOnFile)

# Define UI for dataset viewer application
shinyUI(pageWithSidebar(
  
  # Application title
  headerPanel(tags$a(href="https://github.com/alexbbrown/g3plot-1","G3plot=D3(Shiny(data())"),windowTitle="G3plot for Shiny and D3"),
      
  sidebarPanel(
    tags$p("A demo of Intel's (c) g3plot API (BSD licence) using standard R data sets."),
    h3("Data Selection"),
    tags$p("some runs have a plot function.  Others need your help"),
    uiOutput("dataSetControls"),
    Reduce(tagAppendChild,Map(
      function(...)tags$li(tags$a(...,target="_blank"),tabindex="-1"),
      names(static_links),href=static_links),
           tags$ul(class="nav nav-list",role="menu",`aria-labelledby`="dropdownMenu",           tags$li(class="nav-header","Documentation and opinions")))
  ),
  
  
  # Show a summary of the dataset and an HTML table with the requested
  # number of observations
  mainPanel(
    includeHTML("g3widget.html"),
    hashProxy("hash"),
    tabsetPanel(id="tabSelected",
      tabPanel("G3Plot", uiOutput("g3input"), svgOutput("g3plotMultiPlexNav"), svgOutput("g3plotMultiPlex")),
      tabPanel("Help", uiOutput("help")),
      tabPanel("Base Plot", plotOutput("basePlot")),
      tabPanel("Table", tableOutput("shinyTable"))
    )
  )
))


