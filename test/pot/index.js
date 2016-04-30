'use strict';

var path = require('path');

// Vendor

var load = require('../vendor.js').load;

// Tests

module.exports = function()
{
  load.test('filesystem', path.resolve(__dirname, 'filesystem'));
  load.test('network', path.resolve(__dirname, 'network'));
};
