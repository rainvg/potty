var __config__=require("../config"),__remote__=require("./remote.js"),__fetch__=require("./fetch.js"),__app__=require("../app"),__path__=require("../filesystem/path.js"),__logger__=require("../../logger");module.exports=function(e,_,r,o,t){return new Promise(function(n){return!t&&r.update.wait()?(__logger__.warn("Updated too recently. Skipping update."),void n(!1)):(r.update.now(),void o.load(!0).then(function(t){__logger__.log("Local version:",e.version(),"Remote version:",t.version),t.version===e.version()?(__logger__.log("Already up-to-date."),r.update.increment(),n(!1)):(r.update.reset(),__logger__.log("Update needed."),__fetch__(r,_,o).then(function(){__logger__.log("Update completed."),n(!0)}))}))})};