var nappy=require("nappy"),path=require("path"),genocide=require("genocide"),version=require(path.resolve(__dirname,"..","..","package.json")).version;module.exports=function e(n){"use strict";if(!(this instanceof e))throw{code:0,description:"Constructor must be called with new.",url:""};var o=this,s={sentence:2e3},t=n,i=require(t);if("function"!=typeof i)throw{code:3,description:"App is not a function.",url:""};var c={message:function(){},die:function(){}};process.on("disconnect",function(){c.die()}),o.on=function(e,n){if(!(e in c))throw{code:2,description:"Event does not exist.",url:""};c[e]=n},o.start=function(){process.send({cmd:"start"});var e=!1;process.on("message",function(n){if("setup"!==n.cmd||e)"message"===n.cmd&&c.message(n.message);else{e=!0;var o=function(){nappy.wait["for"](s.sentence).then(genocide.seppuku)};i({id:n.id,version:{main:n.version,potty:version},shutdown:function(){return new Promise(function(e){o(),process.send({cmd:"shutdown"}),process.on("message",function(n){"goodnight"===n.cmd&&e()})})},reboot:function(){return new Promise(function(e){o(),process.send({cmd:"reboot"}),process.on("message",function(n){"goodnight"===n.cmd&&e()})})},update:function(){return new Promise(function(e){o(),process.send({cmd:"update"}),process.on("message",function(n){"goodnight"===n.cmd&&e()})})},install:function(e){return new Promise(function(n){o(),process.send({cmd:"install",meta:{path:e}}),process.on("message",function(e){"goodnight"===e.cmd&&n()})})},on:function(e,n){if(!(e in c))throw{code:2,description:"Event does not exist.",url:""};c[e]=n},message:function(e){process.send({cmd:"message",message:e})}})}})}};