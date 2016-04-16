var _log = function(){};
var _warn = function(){};
var _err = function(){};

module.exports = {
  set: function(__log__, __warn__, __err__)
  {
    _log = __log__;
    _warn = __warn__ || _log;
    _err = __err__ || _log;
  },
  log: function()
  {
    _log.apply(this, arguments);
  },
  warn: function()
  {
    _warn.apply(this, arguments);
  },
  err: function()
  {
    _err.apply(this, arguments);
  }
};
