
var ospath = require('path');
var __path__ = require('../filesystem/path.js');

module.exports = function app(path)
{
  'use strict';

  if(!(path instanceof __path__))
    throw {code: 1, description: 'An instance of path is required.', url: ''};

  var self = this;

  var _version;

  var _path = path;

  self.version = function()
  {
    try
    {
      delete require.cache[require.resolve(ospath.resolve(_path.app(), 'package.json'))];
      _version = require(ospath.resolve(_path.app(), 'package.json')).version;
      return _version;
    } catch(error)
    {
      return '';
    }
  };

};
