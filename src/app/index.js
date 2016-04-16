var nappy = require('nappy');
var path = require('path');
var genocide = require('genocide');

var version = require(path.resolve(__dirname, '..', '..', 'package.json')).version;

module.exports = function app(path)
{
  'use strict';
  
  var self = this;

  // Settings

  var settings = {sentence: 2000};

  // Constructor

  var _path = path;

  var _app = require(_path);
  if(typeof _app !== 'function')
    throw {code: 3, description: 'App is not a function.', url: ''};

  // Events

  var _events = {message: function(){}, die: function(){}};

  process.on('disconnect', function()
  {
    _events.die();
  });

  // Methods

  self.on = function(event, callback)
  {
    if(!(event in _events))
      throw {code: 2, description: 'Event does not exist.', url: ''};

    _events[event] = callback;
  };

  self.start = function()
  {
    process.send({cmd: 'start'});

    var _started = false;

    process.on('message', function(message)
    {
      if(message.cmd === 'setup' && !_started)
      {
        _started = true;

        var __sentence__ = function()
        {
          nappy.wait.for(settings.sentence).then(genocide.seppuku);
        };

        _app({
          id: message.id,
          version: {main: message.version, potty: version},
          shutdown: function()
          {
            return new Promise(function(resolve)
            {
              __sentence__();
              process.send({cmd: 'shutdown'});
              process.on('message', function(message)
              {
                if(message.cmd === 'goodnight')
                  resolve();
              });
            });
          },
          reboot: function()
          {
            return new Promise(function(resolve)
            {
              __sentence__();
              process.send({cmd: 'reboot'});
              process.on('message', function(message)
              {
                if(message.cmd === 'goodnight')
                  resolve();
              });
            });
          },
          update: function()
          {
            return new Promise(function(resolve)
            {
              __sentence__();
              process.send({cmd: 'update'});
              process.on('message', function(message)
              {
                if(message.cmd === 'goodnight')
                  resolve();
              });
            });
          },
          install: function(path)
          {
            return new Promise(function(resolve)
            {
              __sentence__();
              process.send({cmd: 'install', meta: {path: path}});
              process.on('message', function(message)
              {
                if(message.cmd === 'goodnight')
                  resolve();
              });
            });
          },
          on: function(event, callback)
          {
            if(!(event in _events))
              throw {code: 2, description: 'Event does not exist.', url: ''};

              _events[event] = callback;
          },
          message: function(message)
          {
            process.send({cmd: 'message', message: message});
          }
        });
      }
      else if(message.cmd === 'message')
        _events.message(message.message);
    });
  };
};
