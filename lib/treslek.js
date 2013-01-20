var irc = require('irc');

var treslek;

var TreslekBot = function(conf) {
  treslek = this;
  this.conf = conf;
  this.pm = new PluginManager(treslek);
  this.plugins = {};
};


TreslekBot.prototype.start = function() {
  this.irc = new irc.Client(this.conf.host, this.conf.nick, this.conf.ircOptions);

  // Add error listener
  this.irc.addListener('error', function(err) {
    console.log('Error: ' + err);
  });

  // Add say listener
  this.irc.addListener('message#', function(nick, to, text, msg) {
    // Emit message to plugins
    console.log("pubmsg to " + to + " from " + nick);
    console.log(this.plugins);
  });

  this.irc.addListener('pm', function(nick, text, msg) {
    // Emit pm to plugins
    console.log("privmsg from " + nick);
  });
};

var PluginManager = function(treslek) {
  this.treslek = treslek;
};

PluginManager.prototype.registerPlugin = function(plugin) {
  this.treslek.plugins[plugin.name] = plugin;
};



exports.treslek = treslek;
exports.TreslekBot = TreslekBot;
exports.PluginManager = PluginManager;
