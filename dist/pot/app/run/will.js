var nappy=require("nappy"),genocide=require("genocide"),__logger__=require("../../../logger");module.exports=function e(n,t){"use strict";if(!(this instanceof e))throw{code:1,description:"Constructor must be called with new.",url:""};var o=this,i={sentence:2e3},c=t,r={cmd:null,args:[],executed:!1},u={"null":function(){},shutdown:function(){},reboot:function(){},update:function(){},install:function(){}},l=function(){__logger__.log("Sentencing child process."),nappy.wait["for"](i.sentence).then(function(){r.executed||(__logger__.err("Executing sentence."),r.cmd=null,genocide.genocide(c.pid))})};o.set=function(e,n){if(!(e&&e in u))throw{code:2,description:"Will not found.",url:""};if(r.executed)throw{code:3,description:"Will already executed.",url:""};r.cmd||l(),__logger__.log("Setting will to",e),n&&n.length&&__logger__.log("Will arguments:",n),r={cmd:e,args:n||[],executed:!1}},o.once=function(e,n){if(!(e in u))throw{code:2,description:"Will not found.",url:""};u[e]=n},o.bury=function(e){r.executed||(__logger__.log("Burying child process."),r.executed=!0,genocide.genocide(c.pid),n.handle.set("bury",function(){}),n.handle.set("message",function(){}),u[r.cmd](r.args,e))},n.handle.set("bury",o.bury)};