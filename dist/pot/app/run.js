var __spawn__=require("./run/spawn.js"),__will__=require("./run/will.js"),__logger__=require("../../logger");module.exports=function(e,r,n,t){"use strict";var o=t||{};o.parent=o.parent||{},o.parent.version=o.parent.version||"0.0.0";var i=__spawn__(r);i.log.on("stdout",function(e){__logger__.log("[app]",e)}),i.log.on("stderr",function(e){__logger__.err("[app]",e)});var g=new __will__(e,i);g.once(null,function(r,n){__logger__.err("Buried app with no will. An error occurred."),e.trigger("error",{reason:n,stdout:i.log.stdout(),stderr:i.log.stderr()}),e.update().then(function(r){r&&e.trigger("update"),e.trigger("reboot"),e.run()})}),g.once("shutdown",function(){e.trigger("shutdown")}),g.once("reboot",function(){e.trigger("reboot"),e.run()}),g.once("update",function(){e.update().then(function(r){r&&e.trigger("update"),e.trigger("reboot"),e.run()})}),g.once("install",function(r){e.install(r[0]).then(function(r){r&&e.trigger("update"),e.trigger("reboot"),e.run()})}),i.on("message",function(r){"start"!==r.cmd||i.started?"shutdown"===r.cmd||"reboot"===r.cmd||"update"===r.cmd||"install"===r.cmd?(__logger__.log("Command",r.cmd,"received. Sending goodnight."),g.set(r.cmd,r.args||[]),i.send({cmd:"goodnight"})):"message"===r.cmd&&e.trigger("message",r.body):(i.started=!0,i.send({cmd:"setup",id:n.id(),version:o.parent.version}),e.trigger("start"))}),i.on("close",function(e,r){g.bury({event:"close",code:e,signal:r})}),i.on("disconnect",function(){g.bury({event:"disconnect"})}),i.on("error",function(e){g.bury({event:"error",error:e})}),i.on("exit",function(e,r){g.bury({event:"exit",code:e,signal:r})})};