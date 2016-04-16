var ospath = require('path');
var __update__ = require('../network/update.js');
var __path__ = require('../filesystem/path.js');
var __run__ = require('./run.js');
var __logger__ = require('../../logger');

module.exports = function app(remote, path, command, config)
{
  'use strict';

  if(!(this instanceof app))
    throw {code: 0, description: 'Constructor must be called with new.', url: ''};

  if(!(path instanceof __path__))
    throw {code: 1, description: 'An instance of path is required.', url: ''};

  if(!command)
    throw {code: 1, description: 'A command is required.', url: ''};

  var self = this;

  // Constructor

  var _remote = remote;
  var _path = path;

  var _command = typeof command === 'string' ? {command : command} : command;
  _command.args = _command.args || [];
  _command.env = _command.env || {};
  _command.cwd = _command.cwd || process.cwd();

  var _config = config;

  var _events = {error: [], shutdown: [], reboot: [], update: [], message: [], start: []};
  var _handles = {message: function(){}, bury: function(){}};

  // Getters

  self.version = function()
  {
    try
    {
      delete require.cache[require.resolve(ospath.resolve(_path.app(), 'package.json'))];
      var _version = require(ospath.resolve(_path.app(), 'package.json')).version;
      return _version;
    } catch(error)
    {
      return '';
    }
  };

  // Methods

  self.run = function(options)
  {
    __logger__.log('Running app.');
    __run__(self, _command, _config, options);
  };

  self.update = function(force)
  {
    __logger__.log('Updating app.');
    return __update__(self, _path, _config, _remote, force);
  };

  // Events and handles

  self.handle = {};

  self.handle.set = function(handle, callback)
  {
    if(!(handle in _handles))
      throw {code: 2, description: 'Handle not found.', url: ''};

    _handles[handle] = callback;
  };

  self.handle.call = function(handle, value)
  {
    if(!(handle in _handles))
      throw {code: 2, description: 'Handle not found.', url: ''};

    __logger__.log('App handle', handle, 'called with', value);
    _handles[handle](value);
  };

  self.on = function(event, callback)
  {
    if(!(event in _events))
      throw {code: 2, description: 'Event not found.', url: ''};

    _events[event].push(callback);
  };

  self.trigger = function(event, value)
  {
    if(!(event in _events))
      throw {code: 2, description: 'Event not found.', url: ''};

    __logger__.log('Event', event, 'triggered.');

    if(value)
      __logger__.log('Event value:', value);

    _events[event].forEach(function(callback)
    {
      callback(value);
    });
  };
};
