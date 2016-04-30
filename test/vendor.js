'use strict';

var chai = require('chai');
var chai_promised = require('chai-as-promised');
var sinon = require('sinon');

chai.use(chai_promised);
var should = chai.should(); // jshint ignore: line

exports.chai = chai;
exports.sinon = sinon;
exports.should = should;
exports.load = {
  test: function(name, path)
  {
    describe(name, function()
    {
      require(path)();
    });
  }
};
