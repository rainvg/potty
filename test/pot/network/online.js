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
  it('should be online', function(done)
  {
    sinon.stub(needle, 'get', function(url, options, callback)
    {
      var ip = '2.224.212.173';
      callback(undefined, {statusCode: 200, body: ip});
    });

    network.online().should.eventually.equal(true).notify(done);
    needle.get.restore();
  });

  it('should be offline', function(done)
  {
    sinon.stub(needle, 'get', function(url, option, callback)
    {
      callback(undefined, {statusCode: 404, body: undefined});
    });

    network.online().should.eventually.equal(false).notify(done);
    needle.get.restore();
  });
};
