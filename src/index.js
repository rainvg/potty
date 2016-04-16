/*var pot = require('./pot/index.js');
var app = require('./app/index.js');

module.exports = {pot: pot, app: app};*/

var path = require('./pot/filesystem/path.js');
var app = require('./pot/app/app.js');
var spawn = require('./pot/app/run/spawn.js');


var my_path = new path('/Users/monti/.rain');
var my_app = new app(my_path, {command: process.argv[0], args: ['/Users/monti/.rain/app'], env: {ELECTRON_RUN_AS_NODE: undefined}});
var child = spawn(my_app);

child.log.on('stdout', function(line)
{
  console.log(line);
});
