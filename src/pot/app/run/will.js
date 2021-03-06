var nappy = require('nappy');
var genocide = require('genocide');

var __logger__ = require('../../../logger');

module.exports = function will(app, child)
{
  'use strict';

  if(!(this instanceof will))
    throw {code: 1, description: 'Constructor must be called with new.', url: ''};

  var self = this;

  // Settings

  var settings = {sentence: 2000};

  // Constructor

  var _child = child;
  var _will = {cmd: null, args: [], executed: false};
  var _callbacks = {null: function(){}, shutdown: function(){}, reboot: function(){}, update: function(){}, install: function(){}};

  // Private methods

  var __sentence__ = function()
  {
    __logger__.log('Sentencing child process.');
    nappy.wait.for(settings.sentence).then(function()
    {
      if(!(_will.executed))
      {
        __logger__.err('Executing sentence.');
        _will.cmd = null;
        genocide.genocide(_child.pid);
      }
    });
  };

  // Setters

  self.set = function(will, args)
  {
    if(!will || !(will in _callbacks))
      throw {code: 2, description: 'Will not found.', url: ''};

    if(_will.executed)
      throw {code: 3, description: 'Will already executed.', url: ''};

    if(!(_will.cmd))
      __sentence__();

    __logger__.log('Setting will to', will);

    if(args && args.length)
      __logger__.log('Will arguments:', args);

    _will = {cmd: will, args: args || [], executed: false};
  };

  self.once = function(will, callback)
  {
    if(!(will in _callbacks))
      throw {code: 2, description: 'Will not found.', url: ''};

    _callbacks[will] = callback;
  };

  // Methods

  self.bury = function(reason)
  {
    if(_will.executed) return;

    __logger__.log('Burying child process.');

    _will.executed = true;

    genocide.genocide(_child.pid);

    app.handle.set('bury', function(){});
    app.handle.set('message', function(){});

    _callbacks[_will.cmd](_will.args, reason);
  };

  app.handle.set('bury', self.bury);
};
