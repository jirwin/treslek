var irc = require('irc');
var fs = require('fs');
var async = require('async');


/*
 * TreslekBot. Where the magic happens.
 * {Obj} Config object.
 */
var TreslekBot = function(conf) {
  this.conf = conf;
  this.plugins = {};
  this.registeredCommands = {};
  this.registeredHooks = {};
};


/*
 * Start the bot. Connect to irc, connect listeners, and load plugins. 
 */
TreslekBot.prototype.start = function() {
  var that = this;

  this.irc = new irc.Client(this.conf.host, this.conf.nick, this.conf.ircOptions);
  this.irc.connect(1, function() {
    console.log("CONNECTED");
  });

  this.irc.addListener('error', function(err) {
    console.log('Error: ' + err);
  });

  this.irc.addListener('message#', function(from, to, text, msg) {
    // Emit message to plugins
    console.log('pubmsg to ' + to + ' from ' + from);
    that.executeCommands(from, to, text, msg);
    that.executeHooks(from, to, text, msg);
  });

  this.irc.addListener('pm', function(from, text, msg) {
    // Emit pm to plugins
    console.log('privmsg from ' + from);
    that.executeCommands(from, that.conf.nick, text, msg);
  });

  this.loadPlugins();
};


/*
 * Given a message, see if we have any loaded plugins that register
 * a command for the message. Commands start with !.
 */
TreslekBot.prototype.executeCommands = function(from, to, text, msg) {
  var command, plugin;

  if (from === this.conf.nick || text.indexOf('!') !== 0) {
    return;
  }

  text = text.split(' ');

  command = text.shift().slice(1);

  if (!this.registeredCommands.hasOwnProperty(command)) {
    return;
  }

  plugin = new this.plugins[this.registeredCommands[command]]();
  plugin[command](this.irc, to, from, text.join(' '), function(err) {
    if (err) {
      console.log('Error!', err);
      return;
    }
    console.log('Successfully executed ' + command);
  });
};


/*
 * Given a message, send the message to any hooks that have been registered
 * by loaded plugins.
 */
TreslekBot.prototype.executeHooks = function(from, to, text, msg) {
  var that = this;
  
  async.forEach(Object.keys(this.registeredHooks), function(hook, callback) {
    var plugin = new that.plugins[that.registeredHooks[hook]]();
    plugin[hook](that.irc, to, from, text, function(err) {
      if (err) {
        console.log('Error!', err);
        callback();
        return;
      }

      console.log('Successfully executed ' + hook);
      callback();
    });
  });
};



/*
 * Load a plugin, and register its commands and hooks.
 */
TreslekBot.prototype.loadPlugin = function(pluginFile) {
  var plugin,
      that = this;

  try {
    if (require.cache.hasOwnProperty(pluginFile)) {
      delete require.cache[pluginFile];
    }
    var pluginModule = require(pluginFile).Plugin;
    this.plugins[pluginFile] = pluginModule;

    plugin = new pluginModule;

    if (plugin.hasOwnProperty('commands')) {
      plugin.commands.forEach(function(command) {
        that.registeredCommands[command] = pluginFile;
      });
    }

    if (plugin.hasOwnProperty('hooks')) {
      plugin.hooks.forEach(function(hook) {
        that.registeredHooks[hook] = pluginFile;
      });
    }
  } catch (err) {
    console.log('Error loading plugin: ', {plugin: plugin, err: err});
  }
};



/*
 * Check for the plugins_dir specified in the config, and load all js
 * files located there as plugins.
 */
TreslekBot.prototype.loadPlugins = function() {
  var that = this;

  fs.readdir(this.conf.plugins_dir, function(err, files) {
    if (err) {
      return;
    }

    files.forEach(function(file) {
      // Only load js files
      if (file.slice(-3) === '.js') {
        that.loadPlugin(that.conf.plugins_dir + file.slice(0, -3));
      }
    });
  });
};


exports.TreslekBot = TreslekBot;
