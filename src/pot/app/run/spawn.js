var child_process = require('child_process');

var __logger__ = require('../../../logger');

// Settings

var settings = {log: {size: {max: 1048576}}};

var __spawn__ = function(command)
{
  'use strict';

  var _env = process.env;

  for(var key in command.env)
  {
    if(typeof command.env[key] === 'undefined')
      delete process.env[key];
    else
      process.env[key] = command.env[key];
  }

  __logger__.log('Spawning child process.');
  var child = child_process.spawn(command.command, command.args, {cwd: command.cwd, detached: true, stdio: ['pipe', 'pipe', 'pipe', 'ipc']});

  process.env = _env;

  return child;
};

var __setup_log__ = function(child)
{
  'use strict';

  __logger__.log('Binding events to child process.');
  var _log = {stdout: '', stderr: '', events: {stdout: [], stderr: []}};

  var __trigger__ = function(event, value)
  {
    if(!(event in _log.events))
      throw {code: 2, description: 'Event does not exist.', url: ''};

    _log.events[event].forEach(function(callback)
    {
      callback(value);
    });
  };

  child.stdout.on('data', function(data)
  {
    data.toString('utf8').split(/\r?\n/).forEach(function(line)
    {
      if(line.length)
        __trigger__('stdout', line);
    });

    _log.stdout += data;
    if(_log.stdout.length > settings.log.size.max)
      _log.stdout = _log.stdout.slice(_log.stdout.length - settings.log.size.max);
  });

  child.stderr.on('data', function(data)
  {
    data.toString('utf8').split(/\r?\n/).forEach(function(line)
    {
      if(line.length)
        __trigger__('stderr', line);
    });

    _log.stderr += data;
    if(_log.stderr.length > settings.log.size.max)
      _log.stderr = _log.stderr.slice(_log.stderr.length - settings.log.size.max);
  });

  child.log = {
    stdout: function()
    {
      return _log.stdout;
    },
    stderr: function()
    {
      return _log.stderr;
    },
    on: function(event, callback)
    {
      if(!(event in _log.events))
        throw {code: 2, description: 'Event does not exist.', url: ''};

      _log.events[event].push(callback);
    }
  };

  return child;
};

module.exports = function(command)
{
  'use strict';

  return __setup_log__(__spawn__(command));
};
