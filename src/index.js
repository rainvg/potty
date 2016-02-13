var request = require('request');
var nodegit = require('nodegit');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');
var confio = require('confio');

var wait = {
  for: function(milliseconds)
  {
    'use strict';
    return milliseconds < 0 ? Promise.resolve() : new Promise(function(resolve)
    {
        setTimeout(resolve, milliseconds);
    });
  },
  till: function(timestamp)
  {
    'use strict';
    return wait.for(timestamp - new Date().getTime());
  },
  connection: function()
  {
    'use strict';
    var settings = {retry: 1000};

    return new Promise(function(resolve)
    {
      (function poll()
      {
        console.log('Polling connection');

        request('https://api.ipify.org', function(error, response, body)
        {
          if(!error && response.statusCode === 200 && /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/.test(body))
            resolve();
          else
            wait.for(settings.retry).then(poll);
        });
      })();
    });
  }
};

function pot(path, repository, branch)
{
  'use strict';

  // Settings

  var settings = {path_setup: {retry: 1000}, setup: {retry: {min: 1000, max: 604800000}}};

  if(!(this instanceof pot))
    throw {code: 0, description: 'Constructor must be called with new.', url: ''};

  var self = this;

  // Constructor

  var _path = path;
  var _repository = repository;
  var _branch = branch;

  var _config = new confio.confio(path + '/potty.json', __dirname + '/../config/pot.json');

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
    var __setup_try__ = function(path)
    {
      return new Promise(function(resolve, reject)
      {
        rimraf(path, function()
        {
          mkdirp(path, function(error)
          {
            if(error)
              reject(error);
            else
              resolve();
          });
        });
      });
    };

    return new Promise(function(resolve)
    {
      (function loop()
      {
        __setup_try__(_path + '/app').then(function()
        {
          return __setup_try__(_path + '/resources');
        }).then(resolve).catch(function()
        {
          wait.for(settings.path_setup.retry).then(loop);
        });
      })();
    });
  };

  var __setup__ = function()
  {
    var __setup_try__ = function()
    {
      return wait.connection().then(function()
      {
        return nodegit.Clone(_repository, _path + '/app', {checkoutBranch: _branch});
      });
    };

    return __setup_path__().then(function()
    {
      return new Promise(function(resolve)
      {
        wait.till(_config.get('setup_last') + Math.min(Math.pow(2, _config.get('setup_retries')) * settings.setup.retry.min, settings.setup.retry.max)).then(function()
        {
          console.log('Setting up at ', new Date());

          try
          {
            _config.set('setup_last', new Date().getTime());
          } catch(error) {}

          __setup_try__().then(function()
          {
            console.log('Setup succeeded.');

            try
            {
              _config.set('setup_retries', 0);
            } catch(error) {}

            resolve();
          }).catch(function()
          {
            console.log('Setup failed. Waiting.');

            try
            {
              _config.set('setup_retries', _config.get('setup_retries') + 1);
            } catch(error) {}

            __setup__().then(resolve);
          });
        });
      });
    });
  };
}

module.exports = {
  pot: pot
};
