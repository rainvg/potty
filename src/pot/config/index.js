var confio = require('confio');
var randomstring = require('randomstring');
var nappy = require('nappy');

module.exports = function config(config_path, default_path)
{
  'use strict';

  if(!(this instanceof config))
    throw {code: 0, description: 'Constructor must be called with new.', url: ''};

  var self = this;

  // Settings

  var settings = {id: {length: 16}, fetch: {retry: {min: 1000, max: 604800000}}};

  // Constructor

  var _confio = new confio.confio(config_path, default_path);

  // Getters

  self.id = function()
  {
    if(_confio.get('id') === '')
    {
      try
      {
        _confio.set('id', randomstring.generate(settings.id.length));
      } catch(error) {}
    }

    return _confio.get('id');
  };

  // Methods

  self.fetch = {};

  self.fetch.reset = function()
  {
    try
    {
      _confio.set('fetch_retries', 0);
    } catch(error) {}
  };

  self.fetch.increment = function()
  {
    try
    {
      _confio.set('fetch_retries', _confio.get('fetch_retries') + 1);
    } catch(error) {}
  };

  self.fetch.now = function()
  {
    try
    {
      _confio.set('fetch_last', new Date().getTime());
    } catch(error) {}
  };

  self.fetch.wait = function()
  {
    return nappy.wait.till(_confio.get('fetch_last') + Math.min(Math.pow(2, _confio.get('fetch_retries')) * settings.fetch.retry.min, settings.fetch.retry.max));
  };
};
