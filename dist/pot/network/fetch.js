var nappy=require("nappy"),needle=require("needle"),ospath=require("path"),randomstring=require("randomstring"),os=require("os"),__unzip__=require("../filesystem/unzip.js"),__logger__=require("../../logger");module.exports=function(e,n,t){"use strict";var r={filename:{length:16},needle:{open_timeout:1e4,read_timeout:6e4}},o=function(e,n){var t={};for(var r in e)t[r]=e[r];for(var r in n)t[r]=n[r];return t},i=function(){return new Promise(function(e,n){nappy.wait.connection().then(function(){__logger__.log("Attempting download."),t.load().then(function(t){var i={path:ospath.resolve(os.tmpdir(),randomstring.generate(r.filename.length))};__logger__.log("Downloading",t.latest.url,"to",i.path),needle.get(t.latest.url,o(r.needle,{output:i.path}),function(t,r){(t||200!==r.statusCode)&&(__logger__.err("Failed download:",t||r.statusCode),n(t)),__logger__.log("Download succeeded"),e(i.path)})})})})};return new Promise(function(t){!function r(){__logger__.log("Fetching."),n.setup().then(e.fetch.wait).then(function(){return e.fetch.now(),i()}).then(function(e){return __unzip__(n,e)}).then(function(){e.fetch.reset(),t()})["catch"](function(){__logger__.err("Fetch failed. Retrying."),e.fetch.increment(),r()})}()})};