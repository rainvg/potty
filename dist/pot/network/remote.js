var nappy=require("nappy"),needle=require("needle"),__logger__=require("../../logger");module.exports=function e(r,o){"use strict";if(!(this instanceof e))throw{code:0,description:"Constructor must be called with new.",url:""};var t=this;if(!r)throw{code:1,description:"URL must be provided.",url:""};var n,i=r,a=o||{};t.load=function(e){if(!n||e){__logger__.log("Loading remote package.");var r=function(){return new Promise(function(e,r){nappy.wait.connection().then(function(){needle.request("get",i,a,function(o,t){if(o||200!==t.statusCode)return __logger__.err("Failed loading remote package:",o||t.statusCode),void r();try{n=JSON.parse(t.body),__logger__.log("Remote package loaded successfully."),e(n)}catch(o){__logger__.err("Failed parsing JSON:",o),r()}})})})};return new Promise(function(e){!function o(){r().then(e)["catch"](o)}()})}return Promise.resolve(n)}};