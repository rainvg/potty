var fs = require('fs-extra');
var __unzip__ = require('unzip');
var __logger__ = require('../../logger');

module.exports = function unzip(path, zip)
{
  'use strict';
  
  if(!zip)
    throw {code: 2, description: 'A zip file is required.', url: ''};

  return new Promise(function(resolve, reject)
  {
    path.clear.app().then(function()
    {
      __logger__.log('Unzipping', zip, 'to', path.app());
      fs.createReadStream(zip).pipe(__unzip__.Extract({path: path.app()})).on('finish', function()
      {
        __logger__.log('Unzip successful.');
        resolve();
      }).on('error', function(error)
      {
        __logger__.log('Error unzipping:', error);
        reject(error);
      });
    });
  });
};
