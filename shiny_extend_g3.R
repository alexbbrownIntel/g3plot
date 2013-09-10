# Portions of this file are licenced under the terms in the file NOTICE in this package

# extensions to shiny
#
# this file is loaded and used by ui.R and server.R

# make sure the elements of a table are arrays, not elements.
# this avoid JSON converting a data frame into a vector and making
# the data incompatible with the javascript client
forceTableVector = function(table) {
  lapply(table,I)
}

jsInput <- function(inputId)
{
  HTML(paste('<form><select name="g3inputSelect" type="select" id="', inputId, '" class="shiny-network-input" value="ipcScurveD3">
             <option value="Arithmetic" selected="selected">Arithmetic</option>
             <option value="Geometric">Geometric</option>
             <option value="Harmonic">Harmonic</option>
             </select></form>',sep="")) 
}

# custom output element indicating an SVG carry (usually) a reactivePlot consumer.


svgOutput <- function (outputId)
{
  HTML(paste('<div id="', outputId, '" class="shiny-network-output">
             <div class="message"/></div></div>', sep=""))
}

# custom wrapper for reactive for plot type elements.  Includes:
# table - the table of the plot
# mappings - x, y and more, each mapping to a column in the table.
# scales - etc (not implemented yet)
# this may not be 'necessary' but it's convenient.
# TODO: find a way to efficiently supply factors upstream
# note: factors are stringified (as in as.character)
#       named vectors are objectified.
renderG3Plot <- function(func)
{
  reactive({
    #     Rprof(NULL)
    #     Rprof(append=F)
    val <- func()

    canoniseMessage = function(val) {
      if(val$type=="plot") {
        # TODO: process layers - but no need since forceTableVector is always done manually
        # val$table=forceTableVector(val$table)
        # todo: check all the aesthetics are mappable.
        if (is.null(val$layers)) {
          # update to layers       
          props_to_move <- c("layer","table","structure","aesthetic","geom")
          props_to_copy <- c("name")
          val$layers <- list()
          val$layers[1] <- list(val[c(props_to_move,props_to_copy)])
          val[props_to_move] <- NULL

          # make sure geom is a list
          val$layers[[1]]$geom=as.list(val$layers[[1]]$geom)
          # data replaces the old 'table' name
          if (is.null(val$layers[[1]]$data)) val$layers[[1]]$data <- val$layers[[1]]$table 
        }
        val
      } else {
        val
      }
    }
    
    # should strip out unused aes before sending, and check all aes are present,
    # plus add default scales
    if (is.null(names(val))) {
      sendData=lapply(Filter(Negate(is.null),val),function(val) {
        canoniseMessage(val) 
      })
    } else {
      sendData <- canoniseMessage(val)
    }
    
    #     Rprof(NULL)
    #     print(summaryRprof());
    
    sendData
  })
}

# part of the machinery for synching URL and inputs.
hashProxy <- function(inputoutputID) {
  div(id=inputoutputID,class=inputoutputID,tag("div",""));
}

# consume a shiny tag generation function and add an attribute
addAttr <- function(tag, atName, atVal) {
  tag$attribs[atName]<-atVal
  tag
}

# version of selectInput that can take choices as a nested (1 depth)
# list (or 0 depth), and also takes extra attrs for select.
selectInput2 = function (inputId, label, choices, selected = NULL, multiple = FALSE, select.attrs=NA) 
{ 
  if (is.null(selected) && !multiple) 
    selected <- names(unlist(unname(choices))[1])
  
  selectTag <- tags$select(id = inputId)
  if (multiple) 
    selectTag$attribs$multiple <- "multiple"
  if (!is.na(select.attrs))
    selectTag$attribs <- c(selectTag$attribs, select.attrs)
  
  addOptions<-function(choices,selected, toTag) { 
    choices <- choicesWithNames(choices) 
    addOption<-function(choices,choiceName,selected) {
      optionTag <- tags$option(value = choices[[choiceName]], 
                               choiceName)
      if (choices[[choiceName]] %in% selected) 
        optionTag$attribs$selected = "selected"
      optionTag
    }
    for (choiceName in names(choices)) {
      toTag <- 
        tagAppendChild(toTag, 
                       addOption(choices,choiceName,selected));
    }
    toTag
  }
  if (!is.list(choices)) {
    selectTag<-addOptions(choices,selected,selectTag)
  } else {
    selectTag<-Reduce(tagAppendChild,
                      lapply(names(choices),function(optGroupName){
                        addOptions(choices[[optGroupName]],
                                   selected,
                                   tags$optgroup(label=optGroupName))
                      }),
                      selectTag)
  }
  
  tagList(controlLabel(inputId, label), selectTag)
}
# attach the function to the shiny environment.
environment(selectInput2)<-environment(selectInput)

# version of shiny(3.0)::tabsetPanel with active argument
# REQUIRES tabs to have value parameter set.
tabsetPanel2 = function (..., id = NULL, active) {
  tabs <- list(...)
  tabNavList <- tags$ul(class = "nav nav-tabs", id = id)
  tabContent <- tags$div(class = "tab-content")
  firstTab <- TRUE
  tabsetId <- as.integer(stats::runif(1, 1, 10000))
  tabId <- 1
  for (divTag in tabs) {
    thisId <- paste("tab", tabsetId, tabId, sep = "-")
    divTag$attribs$id <- thisId
    tabId <- tabId + 1
    tabValue <- divTag$attribs$`data-value`
    if (!is.null(tabValue) && is.null(id)) {
      stop("tabsetPanel doesn't have an id assigned, but one of its tabPanels ", 
           "has a value. The value won't be sent without an id.")
    }
    liTag <- tags$li(tags$a(href = paste("#", thisId, sep = ""), 
                            `data-toggle` = "tab", `data-value` = tabValue, divTag$attribs$title))
    if (missing(active)) {
      if (firstTab) {
        liTag$attribs$class <- "active"
        divTag$attribs$class <- "tab-pane active"
        firstTab = FALSE
      }
    } else {
      if(tabValue == active) {
        liTag$attribs$class <- "active"
        divTag$attribs$class <- "tab-pane active"
        firstTab = FALSE
      }
    }
    tabNavList <- tagAppendChild(tabNavList, liTag)
    tabContent <- tagAppendChild(tabContent, divTag)
  }
  tabDiv <- tags$div(class = "tabbable", tabNavList, tabContent)
}
# attach the function to the shiny environment.
environment(tabsetPanel2)<-environment(selectInput)
