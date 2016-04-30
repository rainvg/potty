'use strict';

var path = require('path');

// Vendor

var load = require('../vendor.js').load;

// Tests

module.exports = function()
{
  load.test('filesystem', path.resolve(__dirname, 'filesystem'));
  load.test('network', path.resolve(__dirname, 'network'));
  load.test('config', path.resolve(__dirname, 'config'));
  load.test('app', path.resolve(__dirname, 'app'));
};
