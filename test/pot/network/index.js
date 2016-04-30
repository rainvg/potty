'use strict';

var path = require('path');

// Vendor

var load = require('../../vendor.js').load;

// Tests

module.exports = function()
{
  load.test('fetch', path.resolve(__dirname, 'fetch.js'));
  load.test('online', path.resolve(__dirname, 'online.js'));
  load.test('remote', path.resolve(__dirname, 'remote.js'));
  load.test('update', path.resolve(__dirname, 'update.js'));
};
