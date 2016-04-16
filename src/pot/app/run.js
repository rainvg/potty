var __spawn__ = require('./run/spawn.js');
var __will__ = require('./run/will.js');
var __logger__ = require('../../logger');

module.exports = function run(app, command, config, options)
{
  var _options = options || {};
  _options.parent = _options.parent || {};
  _options.parent.version = _options.parent.version || '0.0.0';

  var child = __spawn__(command);

  child.log.on('stdout', function(line)
  {
    __logger__.log('[app]', line);
  });

  child.log.on('stderr', function(line)
  {
    __logger__.err('[app]', line);
  });

  var will = new __will__(app, child);

  will.once(null, function(args, reason)
  {
    __logger__.err('Buried app with no will. An error occurred.');

    app.trigger('error', {reason: reason, stdout: child.log.stdout(), stderr: child.log.stderr()});
    app.update().then(function(updated)
    {
      if(updated)
        app.trigger('update');

      app.trigger('reboot');
      app.run();
    });
  });

  will.once('shutdown', function()
  {
    app.trigger('shutdown');
  });

  will.once('reboot', function()
  {
    app.trigger('reboot');
    app.run();
  });

  will.once('update', function()
  {
    app.update().then(function(updated)
    {
      if(updated)
        app.trigger('update');

      app.trigger('reboot');
      app.run();
    });
  });

  will.once('install', function(args)
  {
    app.install(args[0]).then(function(updated)
    {
      if(updated)
        app.trigger('update');

      app.trigger('reboot');
      app.run();
    });
  });

  child.on('message', function(message)
  {
    if(message.cmd === 'start' && !child.started)
    {
      child.started = true;
      child.send({cmd: 'setup', id: config.id(), version: _options.parent.version});
      app.trigger('start');
    }
    else if(message.cmd === 'shutdown' || message.cmd === 'reboot' || message.cmd === 'update' || message.cmd === 'install')
    {
      __logger__.log('Command', message.cmd, 'received. Sending goodnight.');

      will.set(message.cmd, message.args || []);
      child.send({cmd: 'goodnight'});
    }
    else if(message.cmd === 'message')
    {
      app.trigger('message', message.body);
    }
  });

  child.on('close', function(code, signal) {will.bury({event: 'close', code: code, signal: signal});});
  child.on('disconnect', function() {will.bury({event: 'disconnect'});});
  child.on('error', function(error) {will.bury({event: 'error', error: error});});
  child.on('exit', function(code, signal) {will.bury({event: 'exit', code: code, signal: signal});});
};
