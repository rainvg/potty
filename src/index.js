var http = require('http');
var nodegit = require('nodegit');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');

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

function pot(path, repository, branch)
{
  'use strict';

  // settings

  var settings = {setup_retry: 1000};

  if(!(this instanceof pot))
    throw {code: 0, description: 'Constructor must be called with new.', url: ''};

  var self = this;

  // Constructor

  var _path = path;
  var _repository = repository;
  var _branch = branch;

  // Getters

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

  var __setup__ = function()
  {
    return new Promise(function(resolve)
    {
      __setup_path__().then(wait_connection).then(function()
      {
        return nodegit.Clone(_repository, _path, {checkoutBranch: _branch});
      }).then(resolve).catch(function(){
        setTimeout(function()
        {
          __setup__().then(resolve);
        }, settings.setup_retry);
      });
    });
  };
}

module.exports = {
  pot: pot
};
