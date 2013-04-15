# This 'server' code is the controller for all the dynamic content.
#
# Handling inputs from the web UI
# SQL queries
# Joins/Filters/Diffs/Ratios
# Construction of JSON messages representing graphs
# Construction of dynamic UI (such as the run selection list)

require(shiny);
require(plyr);
require(ggplot2);
# for more datasets uncomment these
#require(plyr)
#require(reshape2)
#require(Hmisc)

source("shiny_extend_g3.R")
source("errors.R")

# which inputs are synched and saved via the URL
url_fields_to_sync <- 
  c("dataSet","tabSelected")

# Note that permission was not sought to use the following link -
# use with caution or provide your own.
onlineHelpServer="http://finzi.psych.upenn.edu/R/library/"

# to use minimised js, run the uglify script (edit as necessary for paths)
# then change below to ./js_min
addResourcePath("js",tools:::file_path_as_absolute("./js")) 

# Define server logic required to summarize and view the selected dataset
shinyServer(function(input, output) {
    
  # SVG/d3 animatable plots
  source("plots.R",local=T)

  # Text/Table info tabs
  source("reports.R",local=T)
  
  # generated dynamic web UI
  source("dynamicUI.R",local=T)
  
  #
  # SVG Javascript d3 multiplexer for navigation --------------------------------------
  #
  
  output$g3plotMultiPlexNav <- renderG3Plot(function() {
    
    if (is.null(input$dataSet)) {
      return(NULL)
    }
    
    tryCatch(
    {
      plotFunction = paste0(input$dataSet,"_nav_plot")
      if (exists(plotFunction)) {
        get(plotFunction)(dataName=input$dataSet)
      } else {
        return(NULL)
      }
    },
    error=function(e) {
      if (inherits(e,"G3Error") && e$type=="FilterDataEmpty") {
        stop("No data found - check your search settings",call.=F)
      }
      if (inherits(e,"G3Error") && e$type=="UnsupportedInputData") {
        stop("Data type not supported yet.  (only 2d data frames really work so far)",call.=F)
      }
      signalCondition(e)
    }
    )
  })
  
  #
  # SVG Javascript d3 multiplexer ------------------------------------------------
  #
  
  # general purpose d3 multiplexer - sends whatever plot to the d3 svg viewer
  output$g3plotMultiPlex <- renderG3Plot(function() {
    
    if (is.null(input$dataSet)) {
      return(NULL)
    }
    
    tryCatch(
      {
        plotFunction = paste0(input$dataSet,"_plot")
        if (exists(plotFunction)) {
          get(plotFunction)(dataName=input$dataSet)
        } else {
          dataSummary(dataName=input$dataSet)
        }
      },
      error=function(e) {
        if (inherits(e,"G3Error") && e$type=="FilterDataEmpty") {
          stop("No data found - check your search settings",call.=F)
        }
        if (inherits(e,"G3Error") && e$type=="UnsupportedInputData") {
          stop("Data type not supported yet.  (only 2d data frames really work so far)",call.=F)
        }
        signalCondition(e)
      }
    )
    
  })
  
  
  
  source("plotinputs.R",local=T)
  
  output$g3input <- renderUI({
    if (is.null(input$dataSet)) return(NULL)
    inputFunction <- paste0(input$dataSet,"_plotinput")
    if (exists(inputFunction)) {
      wellPanel(get(inputFunction)(dataName=input$dataSet))
    } else
    {
      return(div("No input controls available"))
    }
  })

  output$basePlot <- renderPlot({
    if (is.null(input$dataSet)) {
      return(NULL)
    }
    
    tryCatch(
      {
        plot(get(input$dataSet))
      },
    error=function(e) {
      stop("Base plot() failed",call.=F)
    })
  })

  output$shinyTable <- renderTable({
    if (is.null(input$dataSet)) {
      return(NULL)
    }
    
    tryCatch(
      {
        get(input$dataSet)
      },
      error=function(e) {
        stop("render table failed",call.=F)
      })
  })
  
  output$help <- renderUI({
    
    getHelpURL=function(x) {
      file=as.character(help(x))
      if (length(file) == 0) stop("No help file found")
      path <- dirname(file)
      dirpath <- dirname(path)
      pkgname <- basename(dirpath)
      paste0(onlineHelpServer, pkgname, "/html/", basename(file), ".html")
    }
    
    tags$iframe(#style="width: 100%; height: 100%; position: absolute; left: 0px; top: 0px; right: 0px; bottom: 0px; ",
      style="width: 100%; height: 600px;",  # should be sized to contents but no idea how.
      seamless="TRUE",
      src=getHelpURL(input$dataSet))
  })
  
  #
  # URL Control ----------------------------------------------------
  # 

  source("URL.R",local=T)
  
})


