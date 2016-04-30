'use strict';

var path = require('path');

// Vendor

var load = require('../../vendor.js').load;

// Tests

module.exports = function()
{
  load.test('run', path.resolve(__dirname, 'run.js'));
  load.test('spawn', path.resolve(__dirname, 'run', 'spawn.js'));
  load.test('will', path.resolve(__dirname, 'run', 'will.js'));

  describe('object', function()
  {
    it('should be called with new');
  });

};
