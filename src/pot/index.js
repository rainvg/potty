var __app__ = require('./app');
var __network__ = require('./network');
var __filesystem__ = require('./filesystem');
var __config__ = require('./config');
var __logger__ = require('../logger');

var ospath = require('path');

module.exports = function pot(remote, path, command, options)
{
  'use strict';

  if(!(this instanceof pot))
    throw {code: 1, description: 'Constructor must be called with new.', url: ''};

  var self = this;

  // Constructor

  var _path = new __filesystem__.path(path);
  var _config = new __config__(ospath.resolve(path, 'potty.json'));
  var _remote = new __network__.remote(remote, {id: _config.id()});
  var _command = command;
  var _options = options;

  var _app = new __app__(_remote, _path, _command, _config);

  _path.on('error', function(error)
  {
    _app.trigger('error', error);
  });

  // Methods

  self.start = function()
  {
    __logger__.log('Potty starting.');
    __network__.online().then(function(online)
    {
      if(online)
      {
        __logger__.log('Online. Doing on-boot update.');
        return _app.update().then(function()
        {
          _app.run(_options);
        });
      }
      else
        return _app.run(_options);
    });
  };

  self.version = _app.version;
  self.handle = _app.handle;
  self.on = _app.on;
};
