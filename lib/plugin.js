var treslek = require('./treslek').treslek;


var Plugin = function(name, options) {
  this.name = name;
  this.options = options;

  treslek.pm.registerPlugin({name: name, options: options});
};

exports.Plugin = Plugin;
