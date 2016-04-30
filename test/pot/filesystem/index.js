'use strict';

var path = require('path');

// Vendor

var load = require('../../vendor.js').load;

// Tests

module.exports = function()
{
  load.test('path', path.resolve(__dirname, 'path.js'));
  load.test('unzip', path.resolve(__dirname, 'unzip.js'));
};
