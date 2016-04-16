var nappy = require('nappy');
var fs = require('fs-extra');
var child_process = require('child_process');
var __path__ = require('path');
var __logger__ = require('../../logger');

module.exports = function path(root)
{
  'use strict';

  if(!(this instanceof path))
    throw {code: 0, description: 'Constructor must be called with new.', url: ''};

  var self = this;

  // Settings

  var settings = {intervals: {retry: 60000}};

  // Constructor

  var _root = root;
  var _app = __path__.resolve(_root, 'app');
  var _resources = __path__.resolve(_root, 'resources');

  var _events = {error: []};

  // Getters

  self.root = function()
  {
    return _root;
  };

  self.app = function()
  {
    return _app;
  };

  self.resources = function()
  {
    return _resources;
  };

  // Private methods

  var __trigger__ = function(event, value)
  {
    if(!(event in _events))
      throw {code: 2, description: 'Event does not exist.', url: ''};

    _events[event].forEach(function(callback)
    {
      callback(value);
    });
  };

  // Methods

  // TODO: CATCH ME BITCH

  self.on = function(event, callback)
  {
    if(!(event in _events))
      throw {code: 2, description: 'Event does not exist.', url: ''};

    _events[event].push(callback);
  };

  self.setup = function()
  {
    return new Promise(function(resolve)
    {
      (function loop()
      {
        __logger__.log('Setting up path ', _root);

        try
        {
          fs.mkdirsSync(_root);
          fs.mkdirsSync(_app);
          fs.mkdirsSync(_resources);

          if(process.platform === 'win32')
            child_process.execSync('attrib +h ' + _root);

          __logger__.log('Path set up.');
          resolve();
        }
        catch(error)
        {
          __logger__.err('Failed setting up path.');
          __trigger__('error', error);
          nappy.wait.for(settings.intervals.retry).then(loop);
        }
      })();
    });
  };

  self.clear = {
    app: function()
    {
      return new Promise(function(resolve)
      {
        (function loop()
        {
          try
          {
            __logger__.log('Clearing', _app, 'folder.');

            fs.remove(_app);
            resolve();
          } catch(error)
          {
            __logger__.err('Failed clearing folder.');
            __trigger__('error', error);
            nappy.wait.for(settings.intervals.retry).then(loop);
          }
        })();
      });
    }
  };
};
