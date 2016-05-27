var nappy = require('nappy');
var needle = require('needle');
var ospath = require('path');
var randomstring = require('randomstring');
var os = require('os');
var fs = require('fs-extra');

var __unzip__ = require('../filesystem/unzip.js');
var __logger__ = require('../../logger');

module.exports = function fetch(config, path, remote)
{
  'use strict';

  // Settings

  var settings = {filename: {length: 16}, needle: {open_timeout: 10000, read_timeout: 60000}};

  var __download_try__ = function()
  {
    return new Promise(function(resolve, reject)
    {
      nappy.wait.connection().then(function()
      {
        __logger__.log('Attempting download.');

        remote.load().then(function(remote_package)
        {
          var tmp = {path: ospath.resolve(path.root(), 'release.zip')};

          __logger__.log('Downloading', remote_package.latest.url, 'to', tmp.path);
          needle.get(remote_package.latest.url, settings.needle, function(error, response)
          {
            if(error || response.statusCode !== 200)
            {
              __logger__.err('Failed download:', error || response.statusCode);
              reject(error);
            }

            fs.writeFile(tmp.path, response.body, function(error)
            {
              if(error)
                reject(error);
              else
              {
                __logger__.log('Download succeeded');
                resolve(tmp.path);
              }
            });
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
