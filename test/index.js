'use strict';

var path = require('path');

// Vendor

var load = require('./vendor.js').load;

// Tests

describe('potty', function()
{
  load.test('pot', path.resolve(__dirname, 'pot'));
  load.test('logger', path.resolve(__dirname, 'logger'));
  load.test('app', path.resolve(__dirname, 'app'));
});
