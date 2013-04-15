# logscale test
# I may use this in the future

samples=100
geoscale=14
points=20

rangeframe=data.frame(a=exp(geoscale*rnorm(samples)-geoscale/2),
                      b=exp(geoscale*rnorm(samples)-geoscale/2))

rangeframe=mutate(rangeframe,summarize,from=pmin(a,b),to=pmax(a,b))

rangeframe=mutate(rangeframe,magnitude=log(to,10)-log(from,10))

rangeframe=mutate(rangeframe,ppm=points/magnitude)

rangeframe=mutate(rangeframe,index=seq_along(from))

normA=function(x,y=x,base=10)base^(log(x,base)-floor(log(y,base)))

rangeframe=mutate(rangeframe,nfrom=normA(from),nto=normA(to,from))

ggplot(data=rangeframe,aes(rank(to),ymin=from,ymax=to))+geom_linerange()

ggplot(data=rangeframe,aes(rank(nto),ymin=nfrom,ymax=nto))+geom_linerange()

// patterns have a smallest component and an average component size.  the average should be larger than the split.
// how do we deal with...




expand=function(x)list(floor(x[1]),ceiling(x[2]))
scaleBase=function(ppm,base=10)base^floor(1/ppm)
Gticks=function(ppm,from,to,base=10){
  scaleBase(ppm,base)^
    do.call(seq,expand(log(c(from,to),scaleBase(ppm))))
}
with(rangeframe[93,],ticks(ppm,from,to))

# deal with ppm < 1 case. (Gticks)
dlply(rangeframe[rangeframe$ppm<1,],.(rank(magnitude)),function(x)with(x,Gticks(ppm,from,to)))

# the 'average' log scale spacing required
avgspc=with(rangeframe[76,],(log(nto,10)-log(nfrom,10))/points)

# bottom scale first increment that's OK.
# 

round_any=function(x,accuracy,f=round) { f(x/accuracy)*accuracy }

# take one more step
function NStep(nfrom,base=10,stepVec=base^-(1:10),avgspc) {
  goodstep=Filter(function(x){x>avgspc},
         
  )[0]
}

# let's pick a single factor that suits (may undercount)
steps=10^-(-1:10)
steps=sort(c(10^-(10:-1),0.5*10^-(10:-1)))

A=with(rangeframe[76,],log(nfrom+steps,10)-log(nfrom,10))>avgspc

B=with(rangeframe[76,],-log(nto-steps,10)+log(nto,10))>avgspc

C=A&B
steps[C][1] # the first that both have

roundseq=function(from,to,step) {
  rfrom=round_any(from,step,floor);
  rto=round_any(to,step,ceiling);
  seq(rfrom,rto,step)
}
           
with(rangeframe[76,],roundseq(nfrom,nto,steps[C][1]))
           
# todo:
# adapt across the range
# handle copy into multiple magnitudes
# make in-magnitude calculation more arith, less logic.
# case for regular patterns where ppm>1 and ppm <= 10 - use
# either 123456789, 2,4,6,8,10, 2,5,10 5,10 or 10
           
# pick a power of 10 region (from normalised '0' to 10)??
# with an input number of ticks
# for each region estimate the number of ticks
# if it's <= 1, leave
# if it's 1-3, do .5
# if it's 4, do .25, .5, .75
# if it's 5-9, do .2 .4 .6 .8
#         10, do .1 .2 .3. .4 .5 .6 .7 .8
# hmm

# how many per slot for points, for log (1:10)           
round((log(2:10,10)-log(1:9,10))*points*.9)
diff(1:10)
           


# build the recursive estimator
tinymag=subset(rangeframe,magnitude==min(magnitude))

# start at the outermost
outerval=10^(ceiling(with(tinymag,log(to,10))))

linearworker=function(rmin,rmax,vmin,vmax,points_per_range,count,base=10) {
  # a linear worker always divides its range by 10 and splits
  # the points equitably on a logarithmic scale.
  
  # bugs - adds excess one at top of range.
  
  cat("lw start: ",points_per_range," ",rmin, " ", rmax," ct ",count,"\n")
  
  if (rmin>vmax) return();
  if (rmax<vmin) return();
  if (round(points_per_range) == 0) {return(c())};
  
  ticks=c()

  points_per_range=round(points_per_range);

  # short circuit
  if (points_per_range == 1) return(c(rmax))
  
  # subdivide the range
  rangeCuts=seq(rmin,rmax,length.out=count+1)
  #rangeCuts=rangeCuts[-length(rangeCuts)] # we'll handle max
  # allocate points to each subrange
  points=prop.table(diff(log(rangeCuts,base)))*(points_per_range)
  
  # merge values that are below one
  # note there's a bug at 1 that sometimes floor ~1.0 is 0.
  thresholdAccumulate=function(x)
    Reduce(function(a,d,ct=a[1],l=a[-1],nc=ct+d)
      if(nc>=1)c(nc-floor(nc),l,floor(nc))else c(nc,l,0),x,0)[-1]
  
  qpoints=thresholdAccumulate(points)
  
  if(all(points==0)) return(ticks)
  
  # recurse
  ticks=c(ticks,Reduce(c,
         Map(linearworker,
             rangeCuts[-length(rangeCuts)][qpoints!=0],
             rangeCuts[-1][qpoints!=0],
             vmin,
             vmax,
             qpoints[qpoints!=0],
             base
             )));
  cat("end: ", points_per_range," ",rmin, " ", rmax,"\n")
  
  cat("r:",ticks,"\n");
  ticks;
}

sort(linearworker(0.01, 0.10, 0.01, 0.10, 20, 9))

magnitudeworker=function(outerval,vmin,vmax,ppm,base=10) {  
  if(outerval<vmin) return(c());
  if(floor(points == 1)) {
    if(outerval<vmax)return(outerval)else return(c()); # interesting on the outermost case. may be > vmax
  }
  if(floor(points) > 0) {
   
   # handle the linear recursion
   innerval=outerval/base
   cat("mw:",outerval," ",ppm,"\n");
   linearTicks=linearworker(innerval,outerval,
                            vmin,vmax,ppm,base-1,base)
   # handle the magnitude recursion
   magTicks=magnitudeworker(innerval,
                            vmin,vmax,ppm,base)
   return(c(linearTicks,magTicks));
  } else {
   return(c());
  }
}

logTicks<-function(from,to,points,base=10) {
  magnitude<-log(to,base)-log(from,base)
  ppm<-(points)/magnitude # -2 for optional scale endpoints
  if (ppm<1) {
    # function to handle ticks wider than a magnitude
    bigticks=function(ppm,from,to,base=10){
      expand=function(x)list(floor(x[1]),ceiling(x[2]))
      scaleBase=function(ppm,base=10)base^floor(1/ppm)
      scaleBase(ppm,base)^
        do.call(seq,expand(log(c(from,to),scaleBase(ppm))))
    }
    bigticks(ppm,from,to)
  } else {
    # grab each magnitude in turn (in fact they are
    # all the same except for ones at either (or both) ends
    # could optimise this
    log_round=function(x,f=floor,base=10)base^f(log(x,base))
    magnitudeworker(log_round(to,ceiling,base),from,to,ppm);
  }
}

1:10*10^(floor(with(tinymag,log(from,10))))
tinymag$from

log_round=function(x,f=floor,base=10)base^f(log(x,base))

d_ply(rangeframe,.(index),function(x){with(x,plot(sort(magnitudeworker(log_round(to,ceiling),from,to,ppm)),log="y",main=index))})


plot(sort(with(rangeframe[96,],magnitudeworker(log_round(to,ceiling),from,to,ppm))),log="y")



d_ply(rangeframe,.(index),function(x){with(x,plot(sort(logTicks(from,to,points)),log="y",main=index))})

x=sort(with(rangeframe[29,],logTicks(from,to,points)))
x
plot(x,log="y")



d_ply(rangeframe[29,,drop=F],.(index),function(x){with(x,plot(sort(logTicks(from,to,points)),log="y",main=index))})


# funnies:
# 38 - 3 identical
# 57 - oddness
# 61 - is a 3,6,9 maybe?
# 78 - packed too close?
# 90 - a borderline between big and small non repeating patterns!?
# 98
# 100 - hmm