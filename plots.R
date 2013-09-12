# Included from server.R
#
# SVG/d3 animatable graphs  ------------------------------------------------------
#

# Notes on data structure
#
# Structure creates names that point at the table
# Aesthetic creates names that point at the Structure

# Names can either be 
#  a string - which points at a single simple or compound value
#  an object - which constructs a new compunds value out of the named things
#  an array - which refers to a path into the data

# note that while aesthetic variables can be compund, there are parts of the js graph
# including the hierarchical graph, which expect they will be simple strings.

#
# Aggregation Switches
#

# this example includes comments on the fields
Indometh_plot <- function(...) {
  
  dataSet = Indometh
    
  list(type="plot", # plot, or info (has a different format)
       table=forceTableVector(dataSet), # the data.frame, with I() wrapped around the vectors
       name="Indometh", # should be unique, at least to the TYPE of data
       structure=list(Group="Subject", Time="time", Key=list(Subject="Subject",Time="time"), Values="conc"), # describe the relationship of the fields
       aesthetic=list(X="Time", Y="Values", # map the graph aesthetics to the structure
                      Color="Group"
       ),
       labels=list(x="Time of sample (hour)", y="Concentration (mcg/ml)"), # sugar
       geom="point_bar", # the geom - currently has point and bar and pointBar (dotplot)
       # should probably put this UI stuff in the server and decorate the 
       # messages when sending them.
       #onBrush=list(x=list(drag=list(input="#runsSelected",multi=T,value="range"))),
       # x brushes update the an input and can be clicked to zoom in
       onBrush=list(x=list(drag=list(filter=TRUE))), # filters.  only partly implemented here
       scales=list(x="ordinal"), # x and y scales : linear, log, ordinal, date
       grid=list(key=list(Subject="Group"), # how to show the HTML table from the structure.  format not described here
                 group="Time",
                 value="Values")
  );
}

french_fries_plot <- function(...) {
  
  if (is.null(input$rep)) return(NULL)
  
  dataSet = melt(subset(french_fries,rep==input$rep),
                 id.vars=
                   c("time","treatment","subject","rep"))
  
  list(type="plot",
    table=forceTableVector(dataSet),
    name="french_fries",
    structure=list(Key=selfList("time","treatment","subject","variable"),Test=list(Treatment="treatment",Subject="subject"), Flavour="variable",
                   FlavourStrength="value", Group="rep", Time="time", S="subject"),
    aesthetic=list(XCluster=selfList("Flavour"),
                   Y="FlavourStrength", Color="Flavour", Group="Group",
                   YFacet=list("Test","Treatment"),X="Time"
                   ),
    labels=list(x="Time", y="Flavour Treatmt"),
    geom="point",
    scales=list(x="linear"),
    extents=list(y=0),
    position=list(x="stack"),
    grid=list(key="Test",
              group="Flavour",
              value="FlavourStrength"),
    onClick=list(XCluster=list(filter=TRUE)) # input = TRUE simply looks for cluster levels with the same name   
  );
}

tableSample <- function(table,n=1000) {
  table[sample.int(nrow(table),n),]
}

diamonds_plot <- function(...) {
  
  # we can use id as a key
  diamonds2 = diamonds; diamonds2$id = rownames(diamonds)
  
  set.seed(119250721)
  # the tablesample is going to make animation a bit confused.  Need to check 
  # how to stabilise RNG
  dataSet <- tableSample(diamonds2,1000)
  
  if (!is.null(input$clarity) && !input$clarity == "All") {
    dataSet <- dataSet[dataSet$clarity == input$clarity,]
  }
  
  if (!is.null(input$cut) && !input$cut == "All") {
    dataSet <- dataSet[dataSet$cut == input$cut,]
  }
  
  if (!is.null(input$color) && !input$color == "All") {
    dataSet <- dataSet[dataSet$color == input$color,]
  }
  
  list(
  list(type="plot",
       table=forceTableVector(dataSet),
       name="diamonds",
       structure=list(Key="id", Character=list(Cut="cut",Clarity="clarity",color="color"), 
                      Measurements=c(carat="carat",x="x",y="y",z="z",table="table",color="color"), Value="price"),
       aesthetic=list(Key="Key", XCluster=list(Cut=list("Character","Cut")), Y="Value",
                      Color=list("Measurements","color"), X=list("Measurements","carat")
       ),
       labels=list(x="Character of diamond", y="price"),
       geom="point",
       scales=list(x="linear"),
       onBrush=list(x=list(drag=list(filter=TRUE))),
       onClick=list(XCluster=list(input=TRUE)) # input = TRUE simply looks for cluster levels with the same name
  ),
  
  list(type="plot",
       table=forceTableVector(dataSet),
       name="diamonds2",
       structure=list(Key="id", Character=list(Cut="cut",Clarity="clarity",color="color"), 
                      Measurements=c(carat="carat",x="x",y="y",z="z",table="table",color="color"), Value="price"),
       aesthetic=list(Key="Key", XCluster=list(Color=list("Character","color")), 
                      Y="Value",
                      Color=list("Character","Clarity"), X=list("Measurements","carat")
       ),
       labels=list(x="Character of diamond", y="price"),
       geom="point",
       scales=list(x="linear"),
       onBrush=list(x=list(drag=list(filter=TRUE))),
       onClick=list(XCluster=list(input=TRUE)) # input = TRUE simply looks for cluster levels with the same name
       
  ))
}

mpg_plot <- function(...) {
  
  
  if (!is.null(input$manufacturer) && !input$manufacturer=="All") {
    manufacturerZoom = TRUE
    dataSet = subset(mpg,manufacturer==input$manufacturer)
    
    if (!is.null(input$model) && !input$model=="All") {
      modelZoom = TRUE
      dataSet = subset(mpg,model==input$model)
    } else {
      modelZoom = FALSE
    }
  } else {
    manufacturerZoom = FALSE
    dataSet = mpg
  }
  
  # manufacturer  model	displ	year	cyl	trans	drv	cty	hwy	fl	class
  
  list(type="plot",
       table=forceTableVector(dataSet),
       name="mpg",
       structure=list(Model=list(Manuf="manufacturer",Model="model",Year="year"),
                      Year="year", Type=c(class="class",trans="trans"), 
                      MPG=list(cty="cty",hwy="hwy")),
       aesthetic=list(XCluster="Model", Y=list("MPG",
                                        "cty"),
                      Color=list("Type","class")
                      #X="Year"
                      #YFacet=list("Type","trans")
       ),
       labels=list(x="Model", y="mpg"),
       geom="point_bar",
       scales=list(x="unit"),
       extents=list(y=0),
       onClick=list(XCluster=list(input=TRUE))       
  );
}

selfList = function(...) {
  setNames(as.list(...),as.list(...))
}

tips_plot <- function(dataName) {
  
  dataSet <- get(dataName)
  # total_bill  tip	sex	smoker	day	time	size
  
  # tweak it
  #dataSet <- melt(tips,measure.vars=c("tip","total_bill"))runAp
  
  list(type="plot",
       table=forceTableVector(dataSet),
       name=dataName,
       structure=list(Date=selfList("day", "time"), 
                      Server=selfList("sex"),
                      Party=selfList("smoker","size"),
                      Values=list(tip="tip", total_bill="total_bill")),
       aesthetic=list(X=list("Values","total_bill"), 
                      Y=list("Values","tip"), 
                      Color=list("Party","smoker"),
                      YFacet=list("Date","day"),XCluster="Server"
       ),
       labels=list(x="bill", y="tip"),
       geom="point",
       scales=list(x="linear"),
       onBrush=list(x=list(drag=list(filter=TRUE))),
        grid=list(key="Date", # This is broken right now. Don't really have a good general table view for imperfect keys
                  #group="Variable",
                  #group="Server",
                  value=list(server=list("Server","sex"),tip=list("Values","tip"),
                             total_bill=list("Values","total_bill")))
  );
}

msleep_plot <- function(dataName,...) {
  
  if (!is.null(input$order) && !input$order=="All") {
    orderZoom = TRUE
    dataSet = subset(msleep,order==input$order)
    
    if (!is.null(input$genus) && !input$genus=="All") {
      genusZoom = TRUE
      dataSet = subset(dataSet,genus==input$genus)
    } else {
      genusZoom = FALSE
    }
  } else {
    orderZoom = FALSE
    dataSet = msleep
  }
  # name  genus  vore	order	conservation	sleep_total	sleep_rem	sleep_cycle	awake	brainwt	bodywt
  
  cladeLevels <- c("order","genus","name")
  # this next bit is nice but causes some animation problems
  # in the heiraxis the levels jump as it's rescales
  # in the plot since we don't animate between facets as the facets change (shame)
#   partial <- function(x,y)function(...)x(y,...)
#   cladeInputs <- Map(partial(`[[`,input),cladeLevels)
#   cladeIsAll <- Map(partial(`==`,"All"),cladeInputs)
#   showClades = if (cladeIsAll[[1]]) cladeLevels[1] else if (cladeIsAll[[2]]) cladeLevels[1:2] else cladeLevels[1:3]
  showClades = cladeLevels
  
  list(type="plot",
       table=forceTableVector(dataSet),
       name="msleep",
       structure=list(Clade=selfList(showClades), 
                      Info=list(vore="vore",conservation="conservation"), 
                      Meas=selfList("sleep_total","sleep_rem","sleep_cycle","awake","brainwt","bodywt")),
       aesthetic=list(XCluster="Clade", Y=list("Meas",
                                        "sleep_total"),
                      Color=list("Info","vore"),
                      Key=list("Clade","Name")
                     # YFacet=list("Type")
       ),
       labels=list(x="Clade", y="sleep_total",Color="Eating habits"),
       geom="point_bar",
       scales=list(x="unit"),
       extents=list(y=0,Color=levels(msleep$vore)),
       onClick=list(XCluster=list(input=TRUE)) # input = TRUE simply looks for cluster levels with the same name
  );
}

movies_plot <- function(dataName) {
  # name  genus  vore  order	conservation	sleep_total	sleep_rem	sleep_cycle	awake	brainwt	bodywt
  
  # Would be nice to have a function to validate the aesthetic and structure, auto-add axis names if
  # not specified, and drop unused data columns.  Soon.
  
  # let's slice up the data a bit
  movieTypes <- names(movies)[18:24]
  movies2 <- ldply(selfList(movieTypes),function(x)movies[movies[[x]]==1,c("year","length","rating","votes")])
  
  movies2 <- tableSample(movies2,2000) # WARNING DATA LIMITED here for debugging
  
  movies2$year = 1000*unclass(as.POSIXct(strptime(paste0(movies2$year,"-01-01"),"%Y-%m-%d")))
  #browser()
  
  list(type="report",
       data=I(list(
  list(type="plot",
       table=forceTableVector(movies2),
       name=dataName,
       structure=list(Class=".id", Experimental=c(Year="year",Length="length"), Value="rating"),
       aesthetic=list(Color=list("Experimental","Length"),Y="Value",X=list("Experimental","Year"),YFacet="Class",
                      Label="Experimental"
       ),
       labels=list(x="Year", y="Rating"),
       geom="point",
       scales=list(x="date",Color="linear"),
       #onBrush=list(x=list(drag=list(filter=TRUE))),
       onZoom=T),

       
   list(type="plot",
        table=forceTableVector(movies2),
        name=paste0(dataName,"1"),
        structure=list(Class=".id", Experimental=c(Year="year",Length="length"), ValCount="votes",Value="rating"),
        aesthetic=list(Y="Value",X="ValCount",XCluster=list(class="Class")
        ),
        labels=list(x="Year", y="Rating"),
        geom="point",
        scales=list(x="linear"),
        onBrush=list(x=list(drag=list(filter=TRUE))))
       
  )))
  
}

iris_plot <- function(dataName) {

  # This graph uses range_bar and supplies different dx's for different points
  # this use range_bar is not perfectly supported by the filter system, since it has TWO x values - x and dx and filter only 
  # filters on one of them.  this could probably be fixed either by extending the filter system.
  # currently d3events tries to work around this for cases where range_bar is used with a constant dx by picking one dx and
  # left expanding the search range by one of these.

  # Note that this uses zoom over multiple facets, which is unusual and complicated
  
  rawDataSet <- get(dataName)

  if (is.null(input$breaks)) return(NULL)
  
  dataSet = ldply(selfList(names(iris)[1:4]),
                  function(x)with(hist(plot=F,rawDataSet[[x]],breaks=as.numeric(input$breaks)),
                                  data.frame(breaks=breaks[-length(breaks)], widths=diff(breaks), counts)))
  
  names(dataSet)[1] <- "measurement"
  
  list(type="plot",
       table=forceTableVector(dataSet),
       name=dataName, 
       structure=list(Measurement="measurement",Breaks="breaks",
                      Widths="widths", Counts="counts"),
       aesthetic=list(Key=selfList(c("Measurement","Breaks")),X="Breaks", DX="Widths", Y="Counts", YFacet="Measurement"),
       labels=list(x="Size", y="Count"),
       geom="range_bar", 
       onBrush=list(x=list(drag=list(filter=TRUE))),
       scales=list(x="linear",y="linear"), # want to use rangebanded linear here really.  x will be misaligned
       grid=list(key=selfList("Measurement"),
                 group="Breaks",
                 value="Counts"),
       extents=list(y=0),
       onZoom=T # onzoom here seems to reset when switching from zoom to pan or back.  Airquality doesn't.
  );
}

USArrests_plot <- function(dataName) {
  data(USArrests)
  
  # Join state data together
  myArrests <- USArrests
  myArrests$State <- row.names(myArrests)
  # with extra information about the state (key)
  stateInfo <- data.frame(Division=state.division,State=state.name,Population=state.x77[,"Population"])
  myArrests.merged <- merge(myArrests,stateInfo)
  # discard unwanted columns:
  myArrests.merged$UrbanPop <- NULL
  
  # start to build the data and metadata to upload
  uploadData=list(type="plot",name="dataName")
  
  require(reshape2)
  # melt the data to build the correct set of keys
  # sadly this makes the uploaded data larger, but it's 
  # unavoidable if we want to simplify the model.  We may 
  # want to transmit factors as factors and do rle on the
  # data numeric data thus sent.
  # note also that this makes a structure indistinguishable 
  # from a 'sparse' matrix (even though it isn't)
  uploadData$table <- melt(myArrests.merged, 
                           id.vars=c("Division","State","Population"),
                           measure.vars=c("Murder", "Assault", "Rape"),
                           variable.name="Crime",value.name="Count")
  
  uploadData$table = transform(uploadData$table, PerCapita = Count/Population)
  
  # categorise the columns into key and response variables.
  # in general there will be multiple sets of independent keys,
  # but here I have arranged for ONE nested key
  # we could also view these are being partitions of data - 
  # location is hierarchical, crime is flat.
  uploadData$structure <- list(Location=c("Division","State"),
                               Population="Population",
                               Crime="Crime", # only one hierarchy level, so simple.
                               Measure=list(Count="Count", PerCapita="PerCapita")) # for completeness
  
  # build an aesthetic mapping from the data structure to x, y, etc.
  # Note that the aesthetic only applies to one view of the data - it's likely there will
  # be multiple sensible ones, possibly multiple in the same graph.
  # group here is going to mean ggplot's group, position="stack".
  # X and Y are capitalized to distinguish them from later screen-based calculations
  # which produce x and y in javascript (d3.partition will overwrite "x" and "y")
  uploadData$aesthetic <- list(XCluster="Location", Xweight="Population", 
                             #  X="Population",
                               Y=list("Measure","Count"), group="Crime", Fill="Crime")
  
  #uploadData$scale = list(x="ordinal")
  uploadData$position=list(x="stack")
  
  uploadData$geom="bar"
  
  uploadData$name=dataName
  
  uploadData
}

DNase_plot <- function(dataName) {
  dataSet <- get(dataName)
  
  list(type="plot",
       table=forceTableVector(dataSet),
       name=dataName, 
       structure=list(Replicate="Run",Experiment="conc", Response="density"),
       aesthetic=list(X="Experiment", Y="Response"),
       #labels=list(x=field, y="Count"),
       geom="point", 
       #onBrush=list(x=list(drag=list(filter=TRUE))),
       scales=list(x="linear",y="linear"), # want to use rangebanded linear here really.  x will be misaligned
       grid=list(key=list(Experiment="Experiment"),
                 group="Replicate",
                 value="Response")#,
  #     extents=list(y=0,x=with(aHist,breaks[length(breaks)]))
  );
}

airquality_plot <- function(dataName) {
  
  if(!require(mgcv)) stop("Required packages mgcv not available")

  # build a humped model of air quality
  gairq <- gam(Temp~s(Solar.R),data=airquality)
  nSolar.R <- pretty(airquality$Solar.R,n=50)
  # note that JSON chokes on arrays, so convert predict output to a vector
  model_frame <- data.frame(Solar.R=nSolar.R,Temp=as.vector(predict(gairq,data.frame(Solar.R=nSolar.R))))

  
  dataSet <- get(dataName)
  dataSet$row = rownames(dataSet)
  list(
    list(type="plot",
         labels=list(y="Temp",x="Solar Radiation / Wind"),
         onZoom=T,
         scales=list(x="linear",y="linear"),
         name=paste0(dataName,"_AQ"),
         onBrush=list(x=list(drag=list(filter=TRUE))),
         layers=list(
           list(type="layer",
                name="Solar",
                data=forceTableVector(dataSet),
                structure=list(Rownames="row",Measurements=selfList(c("Temp","Solar.R"))),
                aesthetic=list(Key="Rownames",XFilterKey="Rownames",
                               Y=list("Measurements","Temp"),
                               X=list("Measurements","Solar.R")),
                geom=c("voronoi","point")
                #geom=list("point")
           ),
           list(type="layer",
                name="Solar_Model",
                data=forceTableVector(model_frame),
                structure=list(Measurements=selfList(c("Temp","Solar.R"))),
                aesthetic=list(Y=list("Measurements","Temp"),
                               X=list("Measurements","Solar.R")),
                #geom=c("voronoi","point")
                geom=list("line")
           )
         )
    ),
    list(type="plot",
         table=forceTableVector(dataSet),
         name=dataName,
         structure=list(Rownames="row",Measurements=selfList(c("Wind","Temp"))),
         aesthetic=list(Key="Rownames",XFilterKey="Rownames",X=list("Measurements","Wind"), Y=list("Measurements","Temp")),
         #labels=list(x=field, y="Count"),
         geom=c("point"),  # wanted to voronoi here BUT Wind:Temp has some duplicates which crash the algoritm.  need to perterb 
         onBrush=list(x=list(drag=list(filter=TRUE))),
         scales=list(x="linear",y="linear"),
         labels=list(x="Wind",y="Temp"),
         grid=list(Wind=list("Measurements","Wind"),
                   Temp=list("Measurements","Temp")),
         onZoom=T
    )
  )
}

# sunspots_plot <- function(dataName) {
#   
#   dataSet=as.data.frame(xy.coords(get(dataName))[c("x","y")])
#   names(dataSet) = c("fyear","sunspots")
#   dataSet = mutate(dataSet,month=round(1+12*(fyear-floor(fyear))),year=floor(fyear))
#   dataSet = mutate(dataSet,date=paste(sep="-",year,month,"1"))
#   dataSet = summarise(dataSet,year=year,month=month,date=1000*unclass(as.POSIXct(strptime(date,format="%F"))),sunspots=sunspots)
#   
#   list(type="plot",
#        name=dataName,
#        table=forceTableVector(dataSet),
#        structure=selfList(names(dataSet)),
#        aesthetic=list(X="date",Y="sunspots"),
#        geom="line",
#        scales=list(x="date"),
#        onZoom=T,
#        extents=c(zoom=c(0,1000000))
#        )
# }


AirPassengers_plot <- function(dataName) {
  
  dataSet=as.data.frame(xy.coords(get(dataName))[c("x","y")])
  names(dataSet) = c("fyear","passengers")
  dataSet = mutate(dataSet,month=round(1+12*(fyear-floor(fyear))),year=floor(fyear))
  dataSet = mutate(dataSet,date=paste(sep="-",year,month,"1"))
  dataSet = summarise(dataSet,year=year,month=month,date=1000*unclass(as.POSIXct(strptime(date,format="%F"))),passengers=passengers)
  
  #if (!(any(is.null(c(input$month1, input$month2)))) {
  dataSet2 = subset(dataSet, month >= as.numeric(input$month1) & month <= as.numeric(input$month2))
  #}

  
  list(
  list(type="plot",
       name="Airpassengers",
       table=forceTableVector(dataSet2),
       structure=selfList(names(dataSet2)),
       aesthetic=list(X="date",Y="passengers"),
       geom="area",
       labels=list(x="Date",y="Passenger count"),
       scales=list(x="date"),
       extents=list(y=0), 
       onZoom=T
  ),
  list(type="plot",
         name="Airpassengers.bymonth",
         table=forceTableVector(dataSet),
         structure=selfList(names(dataSet)),
         aesthetic=list(X="month",Y="passengers",Color="year"),
         geom="line",
         labels=list(x="Month",y="Passenger count"),
         scales=list(x="linear"),
         onBrush=list(x=list(drag=list(input=list("#month1","#month2"),value="range")))
  )
  )
}

sunspots_nav_plot <- function(dataName) {
  
  dateToJS <- function(x)as.character(1000*unclass(x))
  
  dataSet=as.data.frame(xy.coords(get(dataName))[c("x","y")])
  names(dataSet) = c("fyear","sunspots")
  dataSet = mutate(dataSet,month=round(1+12*(fyear-floor(fyear))),year=floor(fyear))
  dataSet = mutate(dataSet,date=paste(sep="-",year,month,"1"))
  dataSet = mutate(dataSet,date=as.POSIXct(strptime(date,format="%F")))
  dataSet = summarise(dataSet,year=year,month=month,
                      timestamp=dateToJS(date),
                      interval=1000*c(diff(unclass(date)),0),
                      sunspots=sunspots)
  
  list(type="plot",
       name="sunspots_nav",
       table=forceTableVector(dataSet),
       structure=selfList(names(dataSet)),
       aesthetic=list(X="timestamp",Y="sunspots",DX="interval"),
       geom="line",
       scales=list(x="date"),
       onZoom=F,
       labels=list(y="Sunspots per month"),
       onBrush=list(x=list(drag=list(input=list("#startDate","#endDate"),value="range"))),
       dimensions=list(height=100),
       extents=c(y=0)
       #extents=c(zoom=c(0,1000000))
  )
}

sunspots_plot <- function(dataName) {
  
  inputNames <- c("startDate","endDate")
  inputs <- Map(function(x)input[[x]],inputNames)
  if (any(as.logical(lapply(inputs,is.null))) | any(inputs=="")) {
    return(NULL)
  }
  
  dateToJS <- function(x)as.character(1000*unclass(x))
  
  dataSet=as.data.frame(xy.coords(get(dataName))[c("x","y")])
  names(dataSet) = c("fyear","sunspots")
  dataSet = mutate(dataSet,month=round(1+12*(fyear-floor(fyear))),year=floor(fyear))
  dataSet = mutate(dataSet,date=paste(sep="-",year,month,"1"))
  dataSet = mutate(dataSet,date=as.POSIXct(strptime(date,format="%F")))
  dataSet = summarise(dataSet,year=year,month=month,
                      date=date,
                      timestamp=dateToJS(date),
                      interval=1000*c(diff(unclass(date)),0),
                      sunspots=sunspots)
  
  epoch2posix = function(x)as.POSIXct(as.numeric(x)/1000, tz="GMT",origin=ISOdatetime(1970,1,1,0,0,0))
  dateRange = epoch2posix(c(input$startDate,input$endDate))
#  roundDateRange = c(floor_date(dateRange[1], granularity),ceiling_date(dateRange[2],granularity))

  dataSet = subset(dataSet, dateRange[1] <= date & dateRange[2] >= date)
  
  list(type="plot",
       name="sunspots",
       table=forceTableVector(dataSet),
       structure=selfList(names(dataSet)),
       aesthetic=list(Key="timestamp",X="timestamp",Y="sunspots",DX="interval"),
       geom="range_bar",
       scales=list(x="date"),
       onZoom=T,
       extents=c(y=0,zoom=c(-.25,10))
  )
  
}


wikipedia_nav_plot <- function(dataName) {
  
  require(RDruid)
  require(ggplot2)
  
  druid <- druid.url("druid-meetup.mmx.io")
  
 # browser()
  navData <-  druid.query.timeseries(
    url = druid, dataSource = "wikipedia_editstream",
    intervals    = interval(
      ymd("2013-01-01"),
      ymd("2013-04-01")
    ),
    aggregations = sum(metric("count")),
    granularity  = "day"
  )  
   
  dateToJS <- function(x)as.character(1000*unclass(x))
  
  dataSet = navData
  dataSet<-mutate(dataSet,
                  interval=1000*c(diff(unclass(timestamp)),10),
                  timestamp=dateToJS(timestamp)
                  )
  
  list(type="plot",
       name="nav",
       table=forceTableVector(dataSet),
       structure=selfList(names(dataSet)),
       aesthetic=list(X="timestamp",Y="count",DX="interval"),
       geom="range_bar",
       scales=list(x="date"),
       onZoom=F,
       labels=list(y="Edits per day"),
       onBrush=list(x=list(drag=list(input=list("#startDate","#endDate"),value="range"))),
       dimensions=list(height=100),
       extents=c(y=0)
       #extents=c(zoom=c(0,1000000))
  )
}


# TODO: Ozone is very interesting
