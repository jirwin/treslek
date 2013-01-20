var irc = require('irc');

var Treslek = function(conf) {
  this.conf = conf;
};


Treslek.prototype.start = function() {
  this.irc = new irc.Client(this.conf.host, this.conf.nick, this.conf.ircOptions);

  // Add error listener
  this.irc.addListener('error', function(err) {
    console.log('Error: ' + err);
  });

  // Add say listener
  this.irc.addListener('message#', function(nick, to, text, msg) {
    // Emit message to plugins
    console.log("pubmsg to " + to + " from " + nick);
  });

  this.irc.addListener('pm', function(nick, text, msg) {
    // Emit pm to plugins
    console.log("privmsg from " + nick);
  });
};

exports.Treslek = Treslek;
