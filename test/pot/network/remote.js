'use strict';

// Vendor

var vendor = require('../../vendor.js');
var chai = vendor.chai; // jshint ignore: line
var should = vendor.should; // jshint ignore: line
var sinon = vendor.sinon;

// Mocks

var needle = require('needle');

// Files to be tested

var network = require('../../../src/pot/network');

// Tests

module.exports = function()
{
  it('should be called with new', function()
  {
    var constructor_exception = {code: 1, description: 'Constructor must be called with new.', url: ''};
    network.remote.should.throw(constructor_exception);
  });

  it('should be called with an url', function()
  {
    var url_exception = {code: 2, description: 'URL must be provided.', url: ''};
    function remote_creation()
    {
      new network.remote();
    }
    remote_creation.should.throw(url_exception);
  });

  it('should load remote package (5 connection retries, 3 package retries)', function(done)
  {
    this.timeout(10000);
    var _url = 'https://rain.vg/mock';
    var _params = {id: 0};
    var _remote = new network.remote(_url, _params);
    var _package = {
      version: '1.3.17',
      latest: {
        'url': 'https://rain.vg/releases/desktop-daemon/darwin-x64/development/versions/1.3.17.zip'
      }
    };
    var _retries = 0;
    sinon.stub(needle, 'get', function(url, callback)
    {
      if(_retries === 3)
      {
        var ip = '2.224.212.173';
        needle.get.restore();
        callback(undefined, {statusCode: 200, body: ip});
      }
      else
      {
        _retries++;
        callback({value: true}, {statusCode: 404, body: undefined});
      }
    });

    var _package_retries = 0;
    sinon.stub(needle, 'request', function(type, url, params, callback)
    {
      var return_package = {
        statusCode: 200,
        body: JSON.stringify({version: '1.3.17', latest: {'url': 'https://rain.vg/releases/desktop-daemon/darwin-x64/development/versions/1.3.17.zip'}})
      };

      if(_package_retries === 3)
      {
        needle.request.restore();
        callback(undefined, return_package);
      }
      else
      {
        _package_retries++;
        callback({value: true}, {statusCode: 404, body: undefined});
      }
    });

    _remote.load().should.eventually.deep.equal(_package).notify(done);
  });
};
