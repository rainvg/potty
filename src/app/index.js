var nappy = require('nappy');
var path = require('path');
var genocide = require('genocide');

var version = require(path.resolve(__dirname, '..', '..', 'package.json')).version;

module.exports = function potty_app(path, options)
{
  'use strict';

  if(!(this instanceof potty_app))
    throw {code: 0, description: 'Constructor must be called with new.', url: ''};

  var self = this;

  var _path = path;
  var _options = options || {};

  var app = require(_path);

  if(typeof app !== 'function')
    throw {code: 3, description: 'App is not a function.', url: ''};

  if(_options.test)
  {
    self.start = function()
    {
      app({
        id: '[test]',
        version: version,
        shutdown: function()
        {
          if(_options.test.shutdown)
            _options.test.shutdown();

          return Promise.resolve();
        },
        reboot: function()
        {
          if(_options.test.reboot)
            _options.test.reboot();

          return Promise.resolve();
        },
        update: function()
        {
          if(_options.test.update)
            _options.test.update();

          return Promise.resolve();
        },
        install: function(path)
        {
          if(_options.test.install)
            _options.test.install(path);

          return Promise.resolve();
        },
        message: function(message)
        {
          if(_options.test.message)
            _options.test.message(message);
        },
        on: function(event)
        {
          if(!(event in _events))
            throw {code: 2, description: 'Event does not exist.', url: ''};

          console.log('Subscribed to', event, '(will never be fired).');
        }
      });
    };
  }
  else
  {
    var settings = {keepalive: {interval: 500, margin: 10, sleep_threshold: 5000}, sentence: 2000};

    var _events = {message: function(){}, die: function(){}};

    process.on('disconnect', function()
    {
      _events.die();
    });

    self.on = function(event, callback)
    {
      if(!(event in _events))
        throw {code: 2, description: 'Event does not exist.', url: ''};

      _events[event] = callback;
    };

    self.start = function()
    {
      process.send({cmd: 'start'});

      if(_options.keepalive)
      {
        var _keepalive = {alarm: new nappy.alarm(settings.keepalive.margin * settings.keepalive.interval, {sleep_threshold: settings.keepalive.sleep_threshold})};
        _keepalive.alarm.then(genocide.seppuku);
      }

      var _started = false;

      process.on('message', function(message)
      {
        if(_options.keepalive && message.cmd === 'keepalive')
        {
          try
          {
            _keepalive.alarm.reset();
          } catch(error) {}

          process.send({cmd: 'keepalive'});
        }
        else if(message.cmd === 'setup' && !_started)
        {
          _started = true;

          var __sentence__ = function()
          {
            if(_options.keepalive)
            {
              try
              {
                _keepalive.alarm.abort();
              } catch(error) {}
            }

            nappy.wait.for(settings.sentence).then(genocide.seppuku);
          };

          app({
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
  }
};
