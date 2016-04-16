var __config__ = require('../config');
var __remote__ = require('./remote.js');
var __fetch__ = require('./fetch.js');
var __app__ = require('../app');
var __path__ = require('../filesystem/path.js');
var __logger__ = require('../../logger');

module.exports = function update(app, path, config, remote, force)
{
  /*if(!(config instanceof __config__))
    throw {code: 1, description: 'An instance of config is required.', url: ''};

  if(!(remote instanceof __remote__))
    throw {code: 1, description: 'An instance of remote is required.', url: ''};

  if(!(app instanceof __app__))
    throw {code: 1, description: 'An instance of app is required.', url: ''};

  if(!(path instanceof __path__))
    throw {code: 1, description: 'An instance of path is required.', url: ''};*/

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
