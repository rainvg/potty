var __path__ = require('./path.js');
var unzip = require('./unzip.js');
var __update__ = require('../network/update.js');
var __app__ = require('../app/');
var __config__ = require('../config');
var __remote__ = require('../network/remote.js');
var __logger__ = require('../../logger');

module.exports = function install(path, zip, app, config, remote)
{
  if(!(path instanceof __path__))
    throw {code: 1, description: 'An instance of path is required.', url: ''};

  if(!zip)
    throw {code: 1, description: 'A zip file is required.', url: ''};

  if(!(app instanceof __app__))
    throw {code: 1, description: 'An instance of app is required.', url: ''};

  if(!(config instanceof __config__))
    throw {code: 1, description: 'An instance of config is required.', url: ''};

  if(!(remote instanceof __remote__))
    throw {code: 1, description: 'An instance of remote is required.', url: ''};

  return new Promise(function(resolve)
  {
    __logger__.log('Installing', zip);

    unzip(path, zip).then(function()
    {
      __logger__.log('Install successful.');
      resolve(true);
    }).catch(function()
    {
      __logger__.log('Install failed. Calling update.');
      __update__(app, path, config, remote, true).then(resolve);
    });
  });
};
