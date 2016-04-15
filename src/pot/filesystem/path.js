var nappy = require('nappy');
var fs = require('fs-extra');
var child_process = require('child_process');
var __path__ = require('path');

module.exports = function path(root)
{
  'use strict';

  if(!(this instanceof path))
    throw {code: 0, description: 'Constructor must be called with new.', url: ''};

  var self = this;

  // Settings

  var settings = {intervals: {retry: 5000}};

  // Constructor

  var _root = root;
  var _app = __path__.resolve(_root, 'app');
  var _resources = __path__.resolve(_root, 'resources');

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

  // Methods

  self.setup = function()
  {
    return new Promise(function(resolve)
    {
      (function loop()
      {
        try
        {
          fs.mkdirsSync(_root);
          fs.mkdirsSync(_app);
          fs.mkdirsSync(_resources);

          if(process.platform === 'win32')
            child_process.execSync('attrib +h ' + _root);

          resolve();
        }
        catch(error)
        {
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
            fs.remove(_app);
            resolve();
          } catch(error)
          {
            nappy.wait.for(settings.intervals.retry).then(loop);
          }
        })();
      });
    }
  };
};
