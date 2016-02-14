var nappy = require('nappy');
var nodegit = require('nodegit');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');
var confio = require('confio');
var path = require('path');
var child_process = require('child_process');

function pot(root, repository, branch)
{
  'use strict';

  // Settings

  var settings = {path_setup: {retry: 1000}, setup: {retry: {min: 1000, max: 604800000}}, pull: {retries: 5}, run: {keepalive: {interval: 500}, sentence: 2000}};

  if(!(this instanceof pot))
    throw {code: 0, description: 'Constructor must be called with new.', url: ''};

  var self = this;

  // Constructor

  var _path = {root: root, app: path.resolve(root, 'app'), resources: path.resolve(root, 'resources')};
  var _repository = repository;
  var _branch = {local: branch, remote: 'origin/' + branch};

  var _config = new confio.confio(path + '/potty.json', __dirname + '/../config/pot.json');

  // Getters

  self.path = {
    root: function()
    {
      return _path.root;
    },
    app: function()
    {
      return _path.app;
    },
    resources: function()
    {
      return _path.resources;
    }
  };

  self.repository = function()
  {
    return _repository;
  };

  self.branch = {
    local: function()
    {
      return _branch.local;
    },
    remote: function()
    {
      return _branch.remote;
    }
  };

  // Private methods

  var __setup_path__ = function()
  {
    var __setup_try__ = function(path)
    {
      return new Promise(function(resolve, reject)
      {
        rimraf(path, function()
        {
          mkdirp(path, function(error)
          {
            if(error)
              reject(error);
            else
              resolve();
          });
        });
      });
    };

    return new Promise(function(resolve)
    {
      (function loop()
      {
        __setup_try__(_path.app).then(function()
        {
          return __setup_try__(_path.resources);
        }).then(resolve).catch(function()
        {
          nappy.wait.for(settings.path_setup.retry).then(loop);
        });
      })();
    });
  };

  var __setup__ = function()
  {
    var __setup_try__ = function()
    {
      return nappy.wait.connection().then(function()
      {
        return nodegit.Clone(_repository, _path.app, {checkoutBranch: _branch.local});
      });
    };

    return __setup_path__().then(function()
    {
      return new Promise(function(resolve)
      {
        nappy.wait.till(_config.get('setup_last') + Math.min(Math.pow(2, _config.get('setup_retries')) * settings.setup.retry.min, settings.setup.retry.max)).then(function()
        {
          try
          {
            _config.set('setup_last', new Date().getTime());
          } catch(error) {}

          __setup_try__().then(function()
          {
            try
            {
              _config.set('setup_retries', 0);
            } catch(error) {}
            resolve();
          }).catch(function()
          {
            try
            {
              _config.set('setup_retries', _config.get('setup_retries') + 1);
            } catch(error) {}
            __setup__().then(resolve);
          });
        });
      });
    });
  };

  var __pull__ = function()
  {
    var __pull_try__ = function()
    {
      return nappy.wait.connection().then(function()
      {
        return nodegit.Repository.open(_path.app);
      }).then(function(repository)
      {
        return repository.fetch('origin').then(function()
        {
          return repository.mergeBranches(_branch.local, _branch.remote);
        });
      });
    };

    return new Promise(function(resolve)
    {
      var retries = 0;

      (function loop()
      {
        if(retries < settings.pull.retries)
          __pull_try__().then(resolve).catch(function()
          {
            retries++;
            loop();
          });
        else
          __setup__().then(resolve);
      })();
    });
  };

  var __update__ = function()
  {
    return __pull__();
  };

  // Methods

  self.run = function()
  {
    (function loop()
    {
      var child = child_process.fork(_path.app, {cwd: _path.resources});
      var will = null;

      var __bury__ = function()
      {
        if(child.buried) return;

        child.buried = true;
        child.kill();

        ({
          null: function()
          {
            __update__().then(loop);
          },
          shutdown: process.exit,
          reboot: loop,
          update: function()
          {
            __update__(true).then(loop);
          }
        }[will])();
      };

      child.on('close', __bury__);
      child.on('disconnect', __bury__);
      child.on('error', __bury__);
      child.on('exit', __bury__);

      var keepalive = new nappy.alarm(2 * settings.run.keepalive.interval);
      keepalive.then(child.kill);

      child.on('message', function(message)
      {
        if(message.cmd === 'keepalive')
        {
          keepalive.reset();
          child.send({cmd: 'keepalive'});
        }
        else if(message.cmd === 'shutdown' || message.cmd === 'reboot' || message.cmd === 'update')
        {
          will = message.cmd;
          child.send({cmd: 'goodnight'});

          nappy.wait.for(settings.run.sentence).then(function()
          {
            if(will !== 'executed')
            {
              will = null;
              child.kill();
            }
          });
        }
      });
    })();
  };
}

module.exports = {
  pot: pot
};
