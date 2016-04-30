'use strict';

var path = require('path');

// Vendor

var load = require('../../vendor.js').load;

// Tests

module.exports = function()
{
  load.test('remote', path.resolve(__dirname, 'remote.js'));
  load.test('status', path.resolve(__dirname,'online.js'));

  it('should fetch remote package');
  it('should check for update');
};
