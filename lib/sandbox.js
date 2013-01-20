/*
 * Sandbox - A stripped down object of things that plugins can perform.
 * This object will be passed to plugins on command and hook execution.
 */
Sandbox = function(irc, commands, usage) {
  this.bot = {
    say: function(to, msg) {
      irc.say(to, msg);
    },

    action: function(to, msg) {
      irc.action(to, msg);
    },

    commands: function() {
      return commands;
    },

    usage: function() {
      return usage;
    }
  };
};


exports.Sandbox = Sandbox;
