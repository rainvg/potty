var http = require('http');
var nodegit = require('nodegit');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');
var confio = require('confio');

function wait_connection()
{
  'use strict';
  var settings = {interval: 1000};

  return new Promise(function(resolve)
  {
    var interval;

    var poll = function()
    {
      http.get({'host': 'api.ipify.org', 'port': 80, 'path': '/'}, function(resp)
      {
        resp.on('data', function(ip)
        {
          if(/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/.test(ip.toString()) && interval)
          {
            clearInterval(interval);
            interval = null;
            resolve();
          }
        });
      });
    };

    interval = setInterval(poll, settings.interval);
    poll();
  });
}

function schedule(callback, timestamp)
{
  'use strict';

  var now = new Date().getTime();

  if(timestamp <= now)
    callback();
  else
    setTimeout(callback, timestamp - now);
}

function pot(config_path, path, repository, branch)
{
  'use strict';

  // Settings

  var settings = {setup_time_unit: 1000, setup_max_wait: 604800000};

  if(!(this instanceof pot))
    throw {code: 0, description: 'Constructor must be called with new.', url: ''};

  var self = this;

  // Constructor

  var _config_path = config_path;
  var _path = path;
  var _repository = repository;
  var _branch = branch;

  var _config = new confio.confio(_config_path, __dirname + '../config/pot.json');

  // Getters

  self.config_path = function()
  {
    return _config_path;
  };

  self.path = function()
  {
    return _path;
  };

  self.repository = function()
  {
    return _repository;
  };

  self.branch = function()
  {
    return _branch;
  };

  // Private methods

  var __setup_path__ = function()
  {
    return new Promise(function(resolve, reject)
    {
      rimraf(_path, function()
      {
        mkdirp(_path, function(error)
        {
          if(error)
            reject(error);
          else
            resolve();
        });
      });
    });
  };

  var __setup_try__ = function()
  {
    return __setup_path__.then(wait_connection).then(function()
    {
      return nodegit.Clone(_repository, _path, {checkoutBranch: _branch});
    });
  };

  var __setup__ = function()
  {
    return new Promise(function(resolve)
    {
      schedule(function()
      {
        _config.set('setup_last', new Date().getTime());
        __setup_try__().then(function()
        {
          _config.set('setup_retries', 0);
          resolve();
        }).catch(function()
        {
          _config.set('setup_retries', _config.get('setup_retries') + 1);
          __setup__.then(resolve);
        });
      }, _config.get('setup_last') + Math.min(Math.pow(2, _config.get('setup_retries')) * settings.setup_time_unit, settings.setup_max_wait));
    });
  };
}

module.exports = {
  pot: pot
};
