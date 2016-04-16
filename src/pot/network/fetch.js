var nappy = require('nappy');
var needle = require('needle');
var ospath = require('path');
var randomstring = require('randomstring');
var os = require('os');

var __config__ = require('../config');
var __remote__ = require('./remote.js');
var __path__ = require('../filesystem/path.js');
var __unzip__ = require('../filesystem/unzip.js');
var __logger__ = require('../../logger');

module.exports = function fetch(config, path, remote)
{
  if(!(config instanceof __config__))
    throw {code: 1, description: 'An instance of config is required.', url: ''};

  if(!(path instanceof __path__))
    throw {code: 1, description: 'An instance of path is required.', url: ''};

  if(!(remote instanceof __remote__))
    throw {code: 1, description: 'An instance of remote is required.', url: ''};

  // Settings

  var settings = {filename: {length: 16}};

  var __download_try__ = function()
  {
    return new Promise(function(resolve, reject)
    {
      nappy.wait.connection().then(function()
      {
        __logger__.log('Attempting download.');

        remote.load().then(function(package)
        {
          var tmp = {path: ospath.resolve(os.tmpdir(), randomstring.generate(settings.filename.length))};

          __logger__.log('Downloading', package.latest.url, 'to', tmp.path);
          needle.get(package.latest.url, {output: tmp.path}, function(error, response)
          {
            if(error || response.statusCode !== 200)
            {
              __logger__.err('Failed download:', error || response.statusCode);
              reject(error);
            }

            __logger__.log('Download succeeded');
            resolve(tmp.path);
          });
        });
      });
    });
  };

  return new Promise(function(resolve)
  {
    (function loop()
    {
      __logger__.log('Fetching.');
      path.setup().then(config.fetch.wait).then(function()
      {
        config.fetch.now();
        return __download_try__();
      }).then(function(zip)
      {
        return __unzip__(path, zip);
      }).then(function()
      {
        config.fetch.reset();
        resolve();
      }).catch(function()
      {
        __logger__.err('Fetch failed. Retrying.');
        config.fetch.increment();
        loop();
      });
    })();
  });
};
