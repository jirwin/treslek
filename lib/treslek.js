var irc = require('irc');
var fs = require('fs');
var async = require('async');

var TreslekBot = function(conf) {
  this.conf = conf;
  this.plugins = {};
  this.registeredCommands = {};
  this.registeredHooks = {};
};


TreslekBot.prototype.start = function() {
  this.irc = new irc.Client(this.conf.host, this.conf.nick, this.conf.ircOptions);
  this.irc.connect(1, function() {
    console.log("CONNECTED");
  });

  // Add error listener
  this.irc.addListener('error', function(err) {
    console.log('Error: ' + err);
  });

  // Add say listener
  this.irc.addListener('message#', function(from, to, text, msg) {
    // Emit message to plugins
    console.log('pubmsg to ' + to + ' from ' + from);
    this.executeCommands(from, to, text, msg);
    this.executeHooks(from, to, text, msg);
  });

  this.irc.addListener('pm', function(from, text, msg) {
    // Emit pm to plugins
    console.log('privmsg from ' + from);
    this.executeCommands(from, this.conf.nick, text, msg);
  });

  this.loadPlugins();
};

TreslekBot.prototype.executeCommands = function(from, to, text, msg) {
  var command, plugin;

  if (from === this.conf.nick || text.indexOf('!') !== 0) {
    return;
  }

  command = text.split(' ')[0].slice(1);

  if (!this.commands.hasOwnProperty(command)) {
    return;
  }

  plugin = this.plugins[this.commands[command]];
  plugin[command](this.irc, to, from, text, function(err) {
    if (err) {
      console.log('Error!', err);
      return;
    }
    console.log('Successfully executed ' + command);
  });
};

TreslekBot.prototype.executeHooks = function() {
};

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
    plugin.commands.forEach(function(command) {
      that.registeredCommands[command] = pluginFile;
    });
    plugin.hooks.forEach(function(hook) {
      that.registeredHooks[hook] = pluginFile;
    });
  } catch (err) {
    console.log('Error loading plugin: ', {plugin: plugin, err: err});
  }
};

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
