var __fetch__ = require('./fetch.js');
var __logger__ = require('../../logger');

module.exports = function update(app, path, config, remote, force)
{
  'use strict';

  return new Promise(function(resolve)
  {
    if(!force && config.update.wait())
    {
      __logger__.warn('Updated too recently. Skipping update.');
      resolve(false);
      return;
    }

    config.update.now();

    remote.load(true).then(function(remote_package)
    {
      __logger__.log('Local version:', app.version(), 'Remote version:', remote_package.version);

      if(remote_package.version === app.version())
      {
        __logger__.log('Already up-to-date.');
        config.update.increment();
        resolve(false);
      }
      else
      {
        config.update.reset();
        __logger__.log('Update needed.');
        __fetch__(config, path, remote).then(function()
        {
          __logger__.log('Update completed.');
          resolve(true);
        });
      }
    });
  });

};
