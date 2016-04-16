var ospath=require("path"),__update__=require("../network/update.js"),__path__=require("../filesystem/path.js"),__run__=require("./run.js"),__logger__=require("../../logger");module.exports=function e(r,n,o,t){"use strict";if(!(this instanceof e))throw{code:0,description:"Constructor must be called with new.",url:""};if(!(n instanceof __path__))throw{code:1,description:"An instance of path is required.",url:""};if(!o)throw{code:1,description:"A command is required.",url:""};var i=this,u=r,a=n,_="string"==typeof o?{command:o}:o;_.args=_.args||[],_.env=_.env||{},_.cwd=_.cwd||process.cwd();var s=t,c={error:[],shutdown:[],reboot:[],update:[],message:[],start:[]},d={message:function(){},bury:function(){}};i.version=function(){try{delete require.cache[require.resolve(ospath.resolve(a.app(),"package.json"))];var e=require(ospath.resolve(a.app(),"package.json")).version;return e}catch(r){return""}},i.run=function(e){__logger__.log("Running app."),__run__(i,_,s,e)},i.update=function(e){return __logger__.log("Updating app."),__update__(i,a,s,u,e)},i.handle={},i.handle.set=function(e,r){if(!(e in d))throw{code:2,description:"Handle not found.",url:""};d[e]=r},i.handle.call=function(e,r){if(!(e in d))throw{code:2,description:"Handle not found.",url:""};__logger__.log("App handle",e,"called with",r),d[e](r)},i.on=function(e,r){if(!(e in c))throw{code:2,description:"Event not found.",url:""};c[e].push(r)},i.trigger=function(e,r){if(!(e in c))throw{code:2,description:"Event not found.",url:""};__logger__.log("Event",e,"triggered."),r&&__logger__.log("Event value:",r),c[e].forEach(function(e){e(r)})}};