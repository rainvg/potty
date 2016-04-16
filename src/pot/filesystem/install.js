var unzip = require('./unzip.js');
var __update__ = require('../network/update.js');
var __logger__ = require('../../logger');

module.exports = function install(path, zip, app, config, remote)
{
  'use strict';

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
