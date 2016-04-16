var __config__ = require('../config');
var __remote__ = require('.remote.js');
var __fetch__ = require('.fetch.js');
var __app__ = require('../app');
var __path__ = require('../filesystem/path.js');

module.exports = function update(app, path, config, remote, force)
{
  if(!(config instanceof __config__))
    throw {code: 1, description: 'An instance of config is required.', url: ''};

  if(!(remote instanceof __remote__))
    throw {code: 1, description: 'An instance of remote is required.', url: ''};

  if(!(app instanceof __app__))
    throw {code: 1, description: 'An instance of app is required.', url: ''};

  if(!(path instanceof __path__))
    throw {code: 1, description: 'An instance of path is required.', url: ''};

  return new Promise(function(resolve)
  {
    if(!force && config.update.wait())
    {
      resolve(false);
      return;
    }

    config.update.now();

    remote.load(true).then(function(remote_package)
    {
      if(remote_package.version === app.version())
      {
        config.update.increment();
        resolve(false);
      }
      else
      {
        config.update.reset();
        __fetch__(config, path, remote).then(function()
        {
          resolve(true);
        });
      }
    });
  });

};
