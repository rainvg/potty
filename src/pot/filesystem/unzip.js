var fs = require('fs-extra');
var __path__ = require('./path.js');
var __unzip__ = require('unzip');

module.exports = function unzip(path, zip)
{
  if(!(path instanceof __path__))
    throw {code: 1, description: 'An instance of path is required.', url: ''};

  if(!zip)
    throw {code: 2, description: 'A zip file is required.', url: ''};

  return new Promise(function(resolve, reject)
  {
    path.clear.app().then(function()
    {
      fs.createReadStream(zip).pipe(__unzip__.Extract({path: path.app()})).on('finish', resolve).on('error', reject);
    });
  });
};
