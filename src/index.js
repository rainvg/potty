var nappy = require('nappy');
var wrench = require('wrench');
var confio = require('confio');
var path = require('path');
var needle = require('needle');
var child_process = require('child_process');
var randomstring = require('randomstring');
var genocide = require('genocide');
var fs = require('fs');
var os = require('os');
var unzip = require('unzip');
var commander = require('commander');

var electron = (process.versions.electron) ? require('electron') : null;

var version = require(path.resolve(__dirname, '..', 'package.json')).version;

if(require.main !== module)
{
  module.exports = function pot(root, remote, options)
  {
    'use strict';

    // Settings

    var settings = {id: {length: 16}, path_setup: {retry: 1000}, remote_version: {retry: 1000}, fetch: {retry: {min: 1000, max: 604800000}, tmp_file_length: 16}, update: {retry: {min: 1000, max: 604800000}}, start: {autoupdate: {threshold: 604800000}, keepalive: {interval: 500, margin: 10, sleep_threshold: 5000}, sentence: 2000, log: {max_length: 1048576}}};

    if(!(this instanceof pot))
      throw {code: 0, description: 'Constructor must be called with new.', url: ''};

    var self = this;

    // Constructor

    var _path = {root: root, app: path.resolve(root, 'app'), resources: path.resolve(root, 'resources')};
    var _remote = remote;

    var _options = options || {};
    var __log__ = _options.log ? _options.log : function(){};

    var _config = new confio.confio(path.resolve(_path.root, 'potty.json'), path.resolve(__dirname, '..', 'config', 'pot.json'));
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

    self.remote = function()
    {
      return _remote;
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
      __log__('Sending', message, 'to the app.');
      _handles.message(message);
    };

    self.bury = function()
    {
      __log__('Burying the app upon request.');
      _handles.bury();
    };

    // Private methods

    var __online__ = function()
    {
      __log__('Checking online status.');
      return new Promise(function(resolve)
      {
        needle.get('https://api.ipify.org', function(error, response)
        {
          if(!error && response.statusCode === 200 && /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/.test(response.body))
          {
            __log__('App online.');
            resolve(true);
          }
          else
          {
            __log__('App offline');
            resolve(false);
          }
        });
      });
    };

    var __setup_path__ = function()
    {
      __log__('Setting up path.');
      return new Promise(function(resolve)
      {
        (function loop()
        {
          try
          {
            for(var p in _path)
              wrench.mkdirSyncRecursive(_path[p]);

            if(process.platform === 'win32')
              child_process.exec('attrib +h ' + _path.root);

              __log__('Path set up.');
            resolve();
          }
          catch(error)
          {
            __log__('Error setting up path:', error, '(waiting and retrying).');
            nappy.wait.for(settings.path_setup.retry).then(loop);
          }
        })();
      });
    };

    var __unzip_try__ = function(path)
    {
      __log__('Trying to unzip.');
      return new Promise(function(resolve, reject)
      {
        try
        {
          wrench.rmdirSyncRecursive(_path.app);
          fs.createReadStream(path).pipe(unzip.Extract({path: _path.app})).on('finish', function()
          {
            __log__('Unzip succeeded.');
            resolve();
          }).on('error', function(error)
          {
            __log__('Error unzipping:', error);
            reject();
          });
        }
        catch(error)
        {
          __log__('Error unzipping:', error);
          reject();
        }
      });
    };

    var __fetch__ = function()
    {
      __log__('Fetching latest release.');

      var __download_try__ = function()
      {
        __log__('Attempting download.');
        return new Promise(function(resolve, reject)
        {
          nappy.wait.connection().then(function()
          {
            __log__('Connection available. Fetching package info.');
            needle.get(_remote + '?id=' + self.id(), function(error, response)
            {
              if(error || response.statusCode !== 200)
              {
                __log__('Error fetching package info:', error || response.statusCode);
                reject(error);
              }

              try
              {
                __log__('Package info successfully fetched.');
                var pkg = JSON.parse(response.body);

                pkg.tmp = {path: path.resolve(os.tmpdir(), randomstring.generate(settings.fetch.tmp_file_length))};

                __log__('Downloading', pkg.latest.url, 'to', pkg.tmp.path);

                needle.get(pkg.latest.url, {output: pkg.tmp.path}, function(error, response)
                {
                  if(error || response.statusCode !== 200)
                  {
                    __log__('Error downloading:', error || response.statusCode);
                    reject(error);
                  }

                  __log__('Download successful.');
                  resolve(pkg.tmp.path);
                });
              } catch(error)
              {
                __log__('Error parsing package info:', error);
                reject(error);
              }
            });
          });
        });
      };

      return new Promise(function(resolve)
      {
        (function loop()
        {
          __setup_path__().then(function()
          {
            __log__('Waiting for next fetch retry');
            return nappy.wait.till(_config.get('fetch_last') + Math.min(Math.pow(2, _config.get('fetch_retries')) * settings.fetch.retry.min, settings.fetch.retry.max));
          }).then(function()
          {
            try
            {
              _config.set('fetch_last', new Date().getTime());
            } catch(error) {}
          }).then(__download_try__).then(__unzip_try__).then(function()
          {
            try
            {
              _config.set('fetch_retries', 0);
            } catch(error) {}

            __log__('Fetch successful.');
            resolve();
          }).catch(function()
          {
            __log__('Fetch failed. Retrying.');
            try
            {
              _config.set('fetch_retries', _config.get('fetch_retries') + 1);
            } catch(error) {}

            loop();
          });
        })();
      });
    };

    var __app_version__ = function()
    {
      __log__('Fetching app version.');
      try
      {
        var version = require(path.resolve(_path.app, 'package.json')).version;
        __log__('App version is', version);
        return version;
      } catch(error)
      {
        __log__('No version found, returning \'\'');
        return '';
      }
    };

    var __remote_version__ = function()
    {
      __log__('Fetching remote version.');

      var __version_try__ = function()
      {
        __log__('Trying to fetch remote version.');

        return new Promise(function(resolve, reject)
        {
          needle.get(_remote + '?id=' + self.id(), function(error, response)
          {
            if(error || response.statusCode !== 200)
            {
              __log__('Error fetching remote version:', error || response.statusCode);
              reject(error);
            }

            try
            {
              var pkg = JSON.parse(response.body);
              __log__('Remote version is', pkg.version);
              resolve(pkg.version);
            } catch(error)
            {
              __log__('Error parsing package info:', error);
              reject(error);
            }
          });
        });
      };

      return new Promise(function(resolve)
      {
        (function loop()
        {
          __version_try__().then(resolve).catch(function()
          {
            __log__('Failed fetching remote version. Retrying.');
            nappy.wait.for(settings.remote_version.retry).then(loop);
          });
        })();
      });
    };

    var __update__ = function(force)
    {
      __log__(force ? 'Updating forcefully.' : 'Updating.');

      return new Promise(function(resolve)
      {
        if(!force && new Date().getTime() < _config.get('update_last') + Math.min(Math.pow(2, _config.get('update_vain')) * settings.update.retry.min, settings.update.retry.max))
        {
          __log__('Last update too recent. Resolving.');
          resolve(false);
          return;
        }

        try
        {
          _config.set('update_last', new Date().getTime());
        } catch(error) {}

        __remote_version__().then(function(remote_version)
        {
          if(remote_version === __app_version__())
          {
            __log__('Remote version and app version are the same.');
            try
            {
              _config.set('update_vain', _config.get('update_vain') + 1);
            } catch(error) {}

            resolve(false);
          }
          else
          {
            __log__('Remote version is different from app version. Fetching.');
            try
            {
              _config.set('update_vain', 0);
            } catch(error) {}

            __fetch__().then(function()
            {
              __log__('Update completed.');
              resolve(true);
            });
          }
        });
      });
    };

    var __install__ = function(path)
    {
      __log__('Installing', path);

      return new Promise(function(resolve)
      {
        __unzip_try__(path).then(function()
        {
          __log__('Installed successfully.');
          resolve(true);
        }).catch(function()
        {
          __log__('Installation failed. Updating.');
          __update__(true).then(resolve);
        });
      });
    };

    // Methods

    self.start = function()
    {
      __log__('Start called.');

      function loop()
      {
        __log__('Setting environment variables and params.');

        var _env = process.env;

        if('ELECTRON_RUN_AS_NODE' in _options)
        {
          if(_options.ELECTRON_RUN_AS_NODE)
            process.env.ELECTRON_RUN_AS_NODE = true;
          else
            delete process.env.ELECTRON_RUN_AS_NODE;
        }

        var params = [];

        if(options.silent)
          params.push('--silent');

        __log__('Spawning app.');

        var child = child_process.spawn(process.argv[0], [__filename, _path.app].concat(params), {cwd: _path.resources, detached: true, stdio: ['pipe', 'pipe', 'pipe', 'ipc']});

        process.env = _env;

        var will = null;
        var meta = null;

        var log = {stdout: '', stderr: ''};

        child.stdout.on('data', function(data)
        {
          __log__('Data received from app:');
          __log__('{', data, '}');

          _events.data(data);

          log.stdout += data;
          if(log.stdout.length > settings.start.log.max_length)
            log.stdout = log.stdout.slice(log.stdout.length - settings.start.log.max_length);
        });

        child.stderr.on('data', function(data)
        {
          __log__('Error data received from app:');
          __log__('{', data, '}');

          log.stderr += data;
          if(log.stderr.length > settings.start.log.max_length)
            log.stderr = log.stderr.slice(log.stderr.length - settings.start.log.max_length);
        });

        var __bury__ = function(reason)
        {
          if(child.buried) return;

          __log__('Burying app with reason', reason);

          _handles.message = function(){};
          _handles.bury = function(){};

          child.buried = true;

          try
          {
            keepalive.alarm.abort();
          } catch(error){}

          clearInterval(keepalive.interval);

          __log__('Calling genocide on app.');
          genocide.genocide(child.pid);

          ({
            null: function()
            {
              __log__('No will found. Updating.');
              _events.error({reason: reason, log: log});
              __update__().then(loop);
            },
            shutdown: function()
            {
              __log__('Shutdown requested.');
              _events.shutdown();
            },
            reboot: function()
            {
              __log__('Reboot requested.');
              _events.reboot();
              loop();
            },
            update: function()
            {
              __log__('Update requested.');
              __update__(true).then(function(updated)
                {
                  if(!updated)
                    _events.reboot();

                  loop();
                });
            },
            install: function()
            {
              __log__('Install requested on', meta.path);
              __install__(meta.path).then(function(updated)
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
          __log__('Keepalive timeout. Calling genocide.');
          genocide.genocide(child.pid);
        });

        child.on('message', function(message)
        {
          if(message.cmd === 'keepalive')
          {
            if(!child.started)
            {
              child.started = true;
              child.send({cmd: 'setup', id: self.id()});
              _events.start();
            }

            keepalive.alarm.reset();
          }
          else if(message.cmd === 'shutdown' || message.cmd === 'reboot' || message.cmd === 'update' || message.cmd === 'install')
          {
            __log__('Received message:', message.cmd, 'requested');

            will = message.cmd;
            meta = message.meta;

            child.send({cmd: 'goodnight'});

            nappy.wait.for(settings.start.sentence).then(function()
            {
              if(!(child.buried))
              {
                __log__('Child still alive. Sentencing it.');
                will = null;
                genocide.genocide(child.pid);
              }
            });
          }
          else if(message.cmd === 'message')
          {
            __log__('Received message:', message.message);
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

      __online__().then(function(online)
      {
        if(online)
        {
          __log__('App online. Doing on-boot update.');
          __update__().then(loop);
        }
        else
          loop();
      });
    };
  };
}
else
{
  var __run__ = function()
  {
    'use strict';

    commander.version(version).option('-t, --test', 'Run potty to test app').option('-s, --silent', 'Run in silent mode').parse(process.argv);

    if(commander.silent && electron)
    {
      electron.dialog.showErrorBox = function(title, content)
      {
        console.log('[ErrorBox', title, '-', content, ']');
      };
    }

    if(commander.args.length !== 1)
    {
      console.log('App path required.');
      genocide.seppuku();
    }
    else
    {
      try
      {
        var app = require(commander.args[0]);

        if(typeof app !== 'function')
          throw {code: 3, description: 'App is not a function.', url: ''};

        if(commander.test)
        {
          app({
            id: '[test]',
            version: version,
            shutdown: function()
            {
              console.log('Shutdown requested.');
              return Promise.resolve();
            },
            reboot: function()
            {
              console.log('Reboot requested.');
              return Promise.resolve();
            },
            update: function()
            {
              console.log('Update requested.');
              return Promise.resolve();
            },
            install: function(path)
            {
              console.log('Install requested for', path);
              return Promise.resolve();
            },
            message: function(message)
            {
              console.log('Message dispatched:', message);
            },
            on: function(event)
            {
              if(!(event in _events))
                throw {code: 2, description: 'Event does not exist.', url: ''};

              console.log('Subscribed to', event, '(will never be fired).');
            }
          });
        }
        else
        {
          var settings = {keepalive: {interval: 500, margin: 10, sleep_threshold: 5000}, sentence: 2000};

          var _events = {message: function(){}};
          var _keepalive = {alarm: new nappy.alarm(settings.keepalive.margin * settings.keepalive.interval, {sleep_threshold: settings.keepalive.sleep_threshold})};
          var _started = false;

          _keepalive.alarm.then(genocide.seppuku);

          process.on('message', function(message)
          {
            if(message.cmd === 'keepalive')
            {
              _keepalive.alarm.reset();
              process.send({cmd: 'keepalive'});
            }
            else if(message.cmd === 'setup' && !_started)
            {
              _started = true;

              var __sentence__ = function()
              {
                try
                {
                  _keepalive.alarm.abort();
                } catch(error) {}

                nappy.wait.for(settings.sentence).then(genocide.seppuku);
              };

              app({
                id: message.id,
                version: version,
                shutdown: function()
                {
                  return new Promise(function(resolve)
                  {
                    __sentence__();
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
                  return new Promise(function(resolve)
                  {
                    __sentence__();
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
                  return new Promise(function(resolve)
                  {
                    __sentence__();
                    process.send({cmd: 'update'});
                    process.on('message', function(message)
                    {
                      if(message.cmd === 'goodnight')
                        resolve();
                    });
                  });
                },
                install: function(path)
                {
                  return new Promise(function(resolve)
                  {
                    __sentence__();
                    process.send({cmd: 'install', meta: {path: path}});
                    process.on('message', function(message)
                    {
                      if(message.cmd === 'goodnight')
                        resolve();
                    });
                  });
                },
                on: function(event, callback)
                {
                  if(!(event in _events))
                    throw {code: 2, description: 'Event does not exist.', url: ''};

                    _events[event] = callback;
                },
                message: function(message)
                {
                  process.send({cmd: 'message', message: message});
                }
              });
            }
            else if(message.cmd === 'message')
              _events.message(message.message);
          });
        }
      } catch(error)
      {
        console.log('Exiting with error', error);
        genocide.seppuku();
      }
    }
  };

  if(electron)
    electron.app.on('ready', __run__);
  else
    __run__();
}
