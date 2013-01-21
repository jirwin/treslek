var path = require('path');

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

    commands: commands,

    usage: usage
  };
};


/*
 * Update Sandbox.
 */
Sandbox.prototype.update = function(commands, usage) {
  this.bot.commands = commands;
  this.bot.usage = usage;
};


/*
 * AdminSandbox - A less stripped down object of things that admin plugin
 *                can take advantage of.
 */
AdminSandbox = function(treslek) {
  this.bot = {
    say: function(to, msg) {
      treslek.irc.say(to, msg);
    },
    action: function(to, msg) {
      treslek.irc.action(to, msg);
    },

    join: function(channel, callback) {
      treslek.irc.join(channel, callback);
    },
    part: function(channel, callback) {
      treslek.irc.part(channel, callback);
    },

    load: function(plugin, callback) {
      var pluginFile = path.resolve(treslek.conf.plugins_dir, plugin);

      treslek.loadPlugin(pluginFile, function(err) {
        callback();
      });
    },
    reload: function(plugin, callback) {
      var pluginFile = path.resolve(treslek.conf.plugins_dir, plugin);

      if (!treslek.plugins.hasOwnProperty(pluginFile)) {
        callback('Unknown plugin: ' + plugin);
        return;
      }

      treslek.reloadPlugin(pluginFile, function(err) {
        callback();
      });
    },
    unload: function(plugin, callback) {
      var pluginFile = path.resolve(treslek.conf.plugins_dir, plugin);

      if (!treslek.plugins.hasOwnProperty(pluginFile)) {
        callback('Unknown plugin: ' + plugin);
        return;
      }

      treslek.unloadPlugin(pluginFile, function(err) {
        callback();
      });
    },

    ignore: function(nick) {
      treslek.ignoreNick(nick);
    },
    unignore: function(nick) {
      treslek.unignoreNick(nick);
    }
  };
};


exports.Sandbox = Sandbox;
exports.AdminSandbox = AdminSandbox;
