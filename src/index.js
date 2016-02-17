var nappy = require('nappy');
var nodegit = require('nodegit');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');
var confio = require('confio');
var path = require('path');
var child_process = require('child_process');
var randomstring = require('randomstring');

var version = require('../package.json').version;
var npm = path.resolve(__dirname, '../node_modules/npm', require('../node_modules/npm/package.json').bin.npm);
var node = process.argv[0];

function pot(root, repository, branch)
{
  'use strict';

  // Settings

  var settings = {id: {length: 16}, path_setup: {retry: 1000}, setup: {retry: {min: 1000, max: 604800000}}, pull: {retries: 5}, update: {ignore: {min: 1000, max: 604800000}}, start: {keepalive: {interval: 500}, sentence: 2000, log: {max_length: 1048576}}};

  if(!(this instanceof pot))
    throw {code: 0, description: 'Constructor must be called with new.', url: ''};

  var self = this;

  // Constructor

  var _path = {root: root, app: path.resolve(root, 'app'), modules: {app: path.resolve(root, 'app', 'node_modules'), pot: path.resolve(path.dirname(module.parent.filename), 'node_modules')}, resources: path.resolve(root, 'resources')};
  var _repository = repository;
  var _branch = {local: branch, remote: 'origin/' + branch};

  var _config = new confio.confio(_path.root + '/potty.json', __dirname + '/../config/pot.json');
  var _events = {start: function(){}, data: function(){}, error: function(){}, shutdown: function(){}, reboot: function(){}, update: function(){}};

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
    },
    modules: {
      app: function()
      {
        return _path.modules.app;
      },
      pot: function()
      {
        return _path.modules.pot;
      }
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

  self.id = function()
  {
    if(_config.get('id') === '')
    {
      try
      {
        _config.set('id', randomstring.generate(settings.id.length));
      } catch(error) {}
    }

    return _config.get('id');
  };

  // Events

  self.on = function(event, callback)
  {
    if(!(event in _events))
      throw {code: 2, description: 'Event does not exist.', url: ''};

    _events[event] = callback;
  };

  // Private methods

  var __npm_install__ = function()
  {
    return new Promise(function(resolve, reject)
    {
      var install = child_process.fork(npm, ['install'], {cwd: _path.app, silent: true});

      install.on('error', reject);
      install.on('exit', function(code)
      {
        if(code)
          reject();
        else
          resolve();
      });
    });
  };

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
    }).then(function()
    {
      return nodegit.Repository.open(_path.app);
    }).then(function(repository)
    {
      return repository.getBranchCommit(_branch.local);
    }).then(function(commit)
    {
      var updated = _config.get('head') !== commit.id().toString();

      try
      {
        _config.set('head', commit.id().toString());
      } catch(error) {}

      return Promise.resolve(updated);
    });
  };

  var __update__ = function(force)
  {
    if(!force && new Date().getTime() < _config.get('pull_last') + Math.min(Math.pow(2, _config.get('pull_retries')) * settings.update.ignore.min, settings.update.ignore.max))
      return Promise.resolve();
    else
      return __pull__().then(function(updated)
      {
        try
        {
          if(updated)
          {
            _events.update();
            _config.set('pull_retries', 0);
          }
          else
            _config.set('pull_retries', _config.get('pull_retries') + 1);

          _config.set('pull_last', new Date().getTime());
        } catch(error) {}

        return updated;
      }).then(function(updated)
      {
        if(updated)
          return __npm_install__();
        else
          return Promise.resolve();
      });
  };

  // Methods

  self.start = function()
  {
    (function loop()
    {
      var child = child_process.spawn(node, [_path.app], {cwd: _path.resources, detached: true, stdio: ['pipe', 'pipe', 'pipe', 'ipc'], env: {NODE_PATH: _path.modules.pot}});

      var will = null;

      var log = {stdout: '', stderr: ''};

      child.stdout.on('data', function(data)
      {
        _events.data(data);

        log.stdout += data;
        if(log.stdout.length > settings.start.log.max_length)
          log.stdout = log.stdout.slice(log.stdout.length - settings.start.log.max_length);
      });

      child.stderr.on('data', function(data)
      {
        log.stderr += data;
        if(log.stderr.length > settings.start.log.max_length)
          log.stderr = log.stderr.slice(log.stderr.length - settings.start.log.max_length);
      });

      var __bury__ = function(reason)
      {
        if(child.buried) return;

        child.buried = true;
        child.kill();

        ({
          null: function()
          {
            _events.error({reason: reason, log: log});
            __update__().then(loop);
          },
          shutdown: _events.shutdown,
          reboot: function()
          {
            _events.reboot();
            loop();
          },
          update: function()
          {
            __update__(true).then(loop);
          }
        }[will])();

        will = 'executed';
      };

      child.on('close', function(code, signal) {__bury__({event: 'close', code: code, signal: signal});});
      child.on('disconnect', function() {__bury__({event: 'disconnect'});});
      child.on('error', function(error) {__bury__({event: 'error', error: error});});
      child.on('exit', function(code, signal) {__bury__({event: 'exit', code: code, signal: signal});});

      var keepalive = new nappy.alarm(2 * settings.start.keepalive.interval);
      keepalive.then(child.kill);

      child.on('message', function(message)
      {
        if(message.cmd === 'keepalive')
        {
          if(!child.started)
          {
            _events.start();
            child.started = true;
            child.send({cmd: 'setup', version: version, id: self.id()});
          }

          keepalive.reset();
          child.send({cmd: 'keepalive'});
        }
        else if(message.cmd === 'shutdown' || message.cmd === 'reboot' || message.cmd === 'update')
        {
          will = message.cmd;
          child.send({cmd: 'goodnight'});

          nappy.wait.for(settings.start.sentence).then(function()
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

var app = {
  settings: {keepalive: {interval: 500}, sentence: 2000},
  setup: function()
  {
    'use strict';

    return new Promise(function(resolve)
    {
      app.keepalive = {alarm: new nappy.alarm(2 * app.settings.keepalive.interval), interval: setInterval(function()
      {
        process.send({cmd: 'keepalive'});
      }, app.settings.keepalive.interval)};

      app.keepalive.alarm.then(process.exit);

      process.on('message', function(message)
      {
        if(message.cmd === 'keepalive')
          app.keepalive.alarm.reset();
        else if(message.cmd === 'setup')
          resolve({id: message.id, version: message.version});
      });
    });
  },
  shutdown: function()
  {
    'use strict';

    return new Promise(function(resolve)
    {
      app.keepalive.alarm.abort();
      clearInterval(app.keepalive.interval);
      nappy.wait.for(app.settings.sentence).then(process.exit);

      process.send({cmd: 'shutdown'});
      process.on('message', function(message)
      {
        if(message.cmd === 'goodnight')
          resolve();
      });
    });
  },
  reboot: function()
  {
    'use strict';

    return new Promise(function(resolve)
    {
      app.keepalive.alarm.abort();
      clearInterval(app.keepalive.interval);
      nappy.wait.for(app.settings.sentence).then(process.exit);

      process.send({cmd: 'reboot'});
      process.on('message', function(message)
      {
        if(message.cmd === 'goodnight')
          resolve();
      });
    });
  },
  update: function()
  {
    'use strict';

    return new Promise(function(resolve)
    {
      app.keepalive.alarm.abort();
      clearInterval(app.keepalive.interval);
      nappy.wait.for(app.settings.sentence).then(process.exit);

      process.send({cmd: 'update'});

      process.on('message', function(message)
      {
        if(message.cmd === 'goodnight')
          resolve();
      });
    });
  }
};

module.exports = {
  pot: pot,
  app: app
};
