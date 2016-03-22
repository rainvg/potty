var nappy = require('nappy');
var nodegit = require('nodegit');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');
var confio = require('confio');
var path = require('path');
var child_process = require('child_process');
var randomstring = require('randomstring');
var genocide = require('genocide');

var version = require('../package.json').version;

function pot(root, repository, branch, options)
{
  'use strict';

  // Settings

  var settings = {id: {length: 16}, path_setup: {retry: 1000}, setup: {retry: {min: 1000, max: 604800000}}, pull: {retries: 5}, update: {ignore: {min: 1000, max: 604800000}}, start: {autoupdate: {threshold: 604800000}, keepalive: {interval: 500, margin: 10, sleep_threshold: 5000}, sentence: 2000, log: {max_length: 1048576}}};

  if(!(this instanceof pot))
    throw {code: 0, description: 'Constructor must be called with new.', url: ''};

  var self = this;

  // Constructor

  var _path = {root: root, app: path.resolve(root, 'app'), resources: path.resolve(root, 'resources')};
  var _repository = repository;
  var _branch = {local: branch, remote: 'origin/' + branch};
  var _options = options || {};

  var _config = new confio.confio(_path.root + '/potty.json', __dirname + '/../config/pot.json');
  var _events = {start: function(){}, data: function(){}, message: function(){}, error: function(){}, shutdown: function(){}, reboot: function(){}, update: function(){}};
  var _handles = {message: function(){}, bury: function(){}};

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

  // Handles

  self.message = function(message)
  {
    _handles.message(message);
  };

  self.bury = function()
  {
    _handles.bury();
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

  var __stash__ = function()
  {
    return new Promise(function(resolve)
    {
      nodegit.Repository.open(_path.app).then(function(repository)
      {
        return nodegit.Checkout.head(repository, {checkoutStrategy: nodegit.Checkout.STRATEGY.FORCE});
      }).then(resolve).catch(resolve);
    });
  };

  var __update__ = function(force)
  {
    return __stash__().then(function()
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
              _config.set('pull_retries', 0);
              _events.update();
            }
            else
              _config.set('pull_retries', _config.get('pull_retries') + 1);

            _config.set('pull_last', new Date().getTime());
          } catch(error) {}

          return updated;
        });
    });
  };

  // Methods

  self.start = function()
  {
    function loop()
    {
      var _env = process.env;

      if('ELECTRON_RUN_AS_NODE' in _options)
      {
        if(_options.ELECTRON_RUN_AS_NODE)
          process.env.ELECTRON_RUN_AS_NODE = true;
        else
          delete process.env.ELECTRON_RUN_AS_NODE;
      }

      process.env.POTTY = __filename;

      var child = child_process.spawn(process.argv[0], [_path.app], {cwd: _path.resources, detached: true, stdio: ['pipe', 'pipe', 'pipe', 'ipc']});

      process.env = _env;

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

        _handles.message = function(){};
        _handles.bury = function(){};

        child.buried = true;

        try
        {
          keepalive.alarm.abort();
        } catch(error){}

        clearInterval(keepalive.interval);

        genocide.genocide(child.pid);

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
            __update__(true).then(function(updated)
              {
                if(!updated)
                  _events.reboot();

                loop();
              });
          }
        }[will])();
      };

      child.on('close', function(code, signal) {__bury__({event: 'close', code: code, signal: signal});});
      child.on('disconnect', function() {__bury__({event: 'disconnect'});});
      child.on('error', function(error) {__bury__({event: 'error', error: error});});
      child.on('exit', function(code, signal) {__bury__({event: 'exit', code: code, signal: signal});});

      var keepalive = {alarm: new nappy.alarm(settings.start.keepalive.margin * settings.start.keepalive.interval, {sleep_threshold: settings.start.keepalive.sleep_threshold}), interval: setInterval(function()
      {
        child.send({cmd: 'keepalive'});
      }, settings.start.keepalive.interval)};

      keepalive.alarm.then(function()
      {
        genocide.genocide(child.pid);
      });

      child.on('message', function(message)
      {
        if(message.cmd === 'keepalive')
        {
          if(!child.started)
          {
            child.started = true;
            child.send({cmd: 'setup', version: version, id: self.id()});
            _events.start();
          }

          keepalive.alarm.reset();
        }
        else if(message.cmd === 'shutdown' || message.cmd === 'reboot' || message.cmd === 'update')
        {
          will = message.cmd;
          child.send({cmd: 'goodnight'});

          nappy.wait.for(settings.start.sentence).then(function()
          {
            if(!(child.buried))
            {
              will = null;
              genocide.genocide(child.pid);
            }
          });
        }
        else if(message.cmd === 'message')
        {
          _events.message(message.message);
        }
      });

      _handles.message = function(message)
      {
        child.send({cmd: 'message', message: message});
      };

      _handles.bury = function()
      {
        __bury__({event: 'bury'});
      };
    }

    if(new Date().getTime() - _config.get('pull_last') >= settings.start.autoupdate.threshold)
      __update__(true).then(loop);
    else
      loop();
  };
}

var app = {
  settings: {keepalive: {interval: 500, margin: 10, sleep_threshold: 5000}, sentence: 2000},
  events: {message: function(){}},
  setup: function()
  {
    'use strict';

    var _resolved = false;

    return new Promise(function(resolve)
    {
      app.keepalive = {alarm: new nappy.alarm(app.settings.keepalive.margin * app.settings.keepalive.interval, {sleep_threshold: app.settings.keepalive.sleep_threshold})};
      app.keepalive.alarm.then(genocide.seppuku);

      process.on('message', function(message)
      {
        if(message.cmd === 'keepalive')
        {
          app.keepalive.alarm.reset();
          process.send({cmd: 'keepalive'});
        }
        else if(message.cmd === 'setup' && !_resolved)
        {
          _resolved = true;
          resolve({id: message.id, version: message.version});
        }
        else if(message.cmd === 'message')
          app.events.message(message.message);
      });
    });
  },
  shutdown: function()
  {
    'use strict';

    return new Promise(function(resolve)
    {
      try
      {
        app.keepalive.alarm.abort();
      } catch(error) {}

      nappy.wait.for(app.settings.sentence).then(genocide.seppuku);

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
      try
      {
        app.keepalive.alarm.abort();
      } catch(error) {}

      nappy.wait.for(app.settings.sentence).then(genocide.seppuku);

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
      try
      {
        app.keepalive.alarm.abort();
      } catch(error) {}

      nappy.wait.for(app.settings.sentence).then(genocide.seppuku);

      process.send({cmd: 'update'});

      process.on('message', function(message)
      {
        if(message.cmd === 'goodnight')
          resolve();
      });
    });
  },
  on: function(event, callback)
  {
    if(!(event in app.events))
      throw {code: 2, description: 'Event does not exist.', url: ''};

    app.events[event] = callback;
  },
  message: function(message)
  {
    process.send({cmd: 'message', message: message});
  }
};

module.exports = {
  pot: pot,
  app: app
};
