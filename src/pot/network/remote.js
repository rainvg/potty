var nappy = require('nappy');
var needle = require('needle');

module.exports = function remote(url, params)
{
  'use strict';
  
  if(!(this instanceof remote))
    throw {code: 0, description: 'Constructor must be called with new.', url: ''};

  var self = this;

  // Constructor

  if(!url)
    throw {code: 1, description: 'URL must be provided.', url: ''};

  var _url = url;
  var _params = params || {};

  var _package;

  // Methods

  self.load = function(force)
  {
    if(!_package || force)
    {
      var __load_try__ = function()
      {
        return new Promise(function(resolve, reject)
        {
          nappy.wait.connection().then(function()
          {
            needle.request('get', _url, _params, function(error, response)
            {
              if(error || response.statusCode !== 200)
              {
                reject();
                return;
              }

              try
              {
                _package = JSON.parse(response.body);
                resolve(_package);
              } catch(error)
              {
                reject();
              }
            });
          });
        });
      };

      return new Promise(function(resolve)
      {
        (function loop()
        {
          __load_try__().then(resolve).catch(loop);
        })();
      });
    }
    else
      return Promise.resolve(_package);
  };
};
