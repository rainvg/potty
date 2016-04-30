'use strict';

// Vendor

var vendor = require('../../vendor.js');
var sinon = vendor.sinon;
var chai = vendor.chai; // jshint ignore: line
var should = vendor.should; // jshint ignore: line

// Mocks

var path = require('path');
var fs = require('fs-extra');

// Files to be tested

var filesystem = require('../../../src/pot/filesystem');

// Tests

module.exports = function()
{
  it('should be called with new', function()
  {
    var constructor_exception = {code: 1, description: 'Constructor must be called with new.', url: ''};
    filesystem.path.should.throw(constructor_exception);
  });

  it('should be instantiated', function()
  {
    var _path = new filesystem.path('tmp');
    _path.root().should.equal('tmp');
    _path.app().should.equal(path.resolve('tmp', 'app'));
    _path.resources().should.equal(path.resolve('tmp', 'resources'));
  });

  it('should setup path correctly', function(done)
  {
    var _path = new filesystem.path('tmp');
    _path.setup().then(function()
    {
      fs.existsSync(_path.app()).should.equal(true);
      fs.existsSync(_path.resources()).should.equal(true);
      fs.removeSync(_path.app());
      fs.removeSync(_path.resources());
      fs.removeSync(_path.root());
      done();
    });
  });

  it('should wait one minute and retry in case of setup path exceptions', function(done)
  {
    this.skip();

    this.timeout(65000);
    sinon.stub(fs, 'mkdirsSync', function()
    {
      fs.mkdirsSync.restore();
      throw {'Error': 'Permission Denied'};
    });

    var _path = new filesystem.path('tmp');
    _path.setup().then(function()
    {
      fs.existsSync(_path.app()).should.equal(true);
      fs.existsSync(_path.resources()).should.equal(true);
      fs.removeSync(_path.app());
      fs.removeSync(_path.resources());
      fs.removeSync(_path.root());
      done();
    });
  });

  it('should clear', function(done)
  {
    this.timeout(10000);
    var _path = new filesystem.path('tmp');
    _path.setup().then(_path.clear.app).then(function()
    {
      fs.existsSync(_path.app()).should.not.equal(true);
      fs.existsSync(_path.resources()).should.equal(true);
      fs.existsSync(_path.root()).should.equal(true);
      fs.removeSync(_path.resources());
      fs.removeSync(_path.root());
      done();
    });
  });

  it('should wait one minute and retry in case of clear exceptions', function(done)
  {
    this.skip();
    
    this.timeout(65000);

    sinon.stub(fs, 'mkdirsSync', function()
    {
      fs.mkdirsSync.restore();
      throw {'Error': 'Permission Denied'};
    });

    var _path = new filesystem.path('tmp');
    _path.setup().then(_path.clear.app).then(function()
    {
      fs.existsSync(_path.app()).should.not.equal(true);
      fs.existsSync(_path.resources()).should.equal(true);
      fs.existsSync(_path.root()).should.equal(true);
      fs.removeSync(_path.resources());
      fs.removeSync(_path.root());
      done();
    });
  });
};
