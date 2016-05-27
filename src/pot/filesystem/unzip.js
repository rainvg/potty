var fs = require('fs-extra');
var __zip__ = require('adm-zip');
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

      try
      {
        var archive = new __zip__(zip);

        if(typeof archive === 'undefined')
        {
          reject();
          return;
        }

        archive.extractAllToAsync(path, true, function(error)
        {
          if(typeof error !== 'undefined')
            reject();
          else
            resolve();
        });
      }
      catch(error)
      {
        reject();
      }
    });
  });
};
