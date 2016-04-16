var __spawn__ = require('./run/spawn.js');
var __will__ = require('./run/message.js');

module.exports = function run(app)
{
  var child = __spawn__(app);
  var will = new __will__(app, child);

  will.once(null, function(args, reason)
  {
    app.trigger('error', {reason: reason, stdout: child.log.stdout(), stderr: child.log.stderr()});
    app.update().then(function(updated)
    {
      if(updated)
        app.trigger('update');

      app.trigger('reboot');
      run(app);
    });
  });

  will.once('shutdown', function()
  {
    app.trigger('shutdown');
  });

  will.once('reboot', function()
  {
    app.trigger('reboot');
    run(app);
  });

  will.once('update', function()
  {
    app.update().then(function(updated)
    {
      if(updated)
        app.trigger('update');

      app.trigger('reboot');
      run(app);
    });
  });

  will.once('install', function(args)
  {
    app.install(args[0]).then(function(updated)
    {
      if(updated)
        app.trigger('update');

      app.trigger('reboot');
      run(app);
    });
  });

  child.on('close', function(code, signal) {will.bury({event: 'close', code: code, signal: signal});});
  child.on('disconnect', function() {will.bury({event: 'disconnect'});});
  child.on('error', function(error) {will.bury({event: 'error', error: error});});
  child.on('exit', function(code, signal) {will.bury({event: 'exit', code: code, signal: signal});});
};
