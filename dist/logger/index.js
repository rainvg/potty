var _log=function(){},_warn=function(){},_err=function(){};module.exports={set:function(n,o,r){_log=n,_warn=o||_log,_err=r||_log},log:function(){_log.apply(this,arguments)},warn:function(){_warn.apply(this,arguments)},err:function(){_err.apply(this,arguments)}};