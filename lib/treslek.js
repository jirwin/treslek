var irc = require('irc');
var fs = require('fs');
var path = require('path');
var async = require('async');
var redis = require('redis');
var sprintf = require('sprintf').sprintf;

var Sandbox = require('./sandbox').Sandbox;
var AdminSandbox = require('./sandbox').AdminSandbox;

/*
 * TreslekBot. Where the magic happens.
 * {Obj} Config object.
 */
var TreslekBot = function(conf) {
  this.conf = conf;
  this.plugins = {};
  this.adminCommands = {};
  this.registeredCommands = {};
  this.registeredHooks = {};
  this.commandUsage = {};
  this.redis = redis.createClient(this.conf.redis.port, this.conf.redis.host);
};


/*
 * Start the bot. Connect to irc, connect listeners, and load plugins.
 */
TreslekBot.prototype.start = function() {
  var that = this;

  this.irc = new irc.Client(this.conf.host, this.conf.nick, this.conf.ircOptions);

  this.irc.treslekProcessMessage = function(from, to, text, msg) {
    console.log('processing message!');
    if (from !== that.conf.nick && that.conf.ignored.indexOf(from) === -1) {
      async.parallel({
        log: function(callback) {
          that.logMessage(from, to, text, msg);
          callback();
        },
        commands: function(callback) {
          that.executeCommands(from, to, text, msg);
          callback();
        },
        hooks: function(callback) {
          that.executeHooks(from, to, text, msg);
          callback();
        },
        adminCommands: function(callback) {
          that.executeAdminCommands(from, to, text, msg);
          callback();
        }
      });
    }
  };

  this.irc.connect(1, function() {
    console.log("CONNECTED");
  });

  this.irc.addListener('error', function(err) {
    console.log('Error');
    console.dir(err);
  });

  this.irc.addListener('topic', function(channel, topic, nick, msg) {
    var topicStore = sprintf('%s:topic:%s', that.conf.redis.prefix, channel);
    that.redis.set(topicStore, topic);
  });

  this.irc.addListener('message#', this.irc.treslekProcessMessage);

  this.irc.addListener('pm', function(from, text, msg) {
    console.log('privmsg from ' + from);
    this.irc.treslekProcessMessage(from, from, text, msg);
  }.bind(this));

  that.sandbox = new Sandbox(that.conf, that.irc, that.redis, Object.keys(that.registeredCommands), that.commandUsage);
  that.adminSandbox = new AdminSandbox(that);

  this.loadPlugins(function(err) {
    console.log('Loaded plugins.');
  });

  this.loadAdminPlugin(function(err) {
    console.log('Loaded admin plugins.');
  });
};



/*
 * Execute admin commands.
 */
TreslekBot.prototype.executeAdminCommands = function(from, to, text, msg) {
  var args = text.split(' '),
      command = args.shift().slice(1),
      plugin;

  if (!this.adminCommands.hasOwnProperty(command)) {
    return;
  }

  if (this.conf.admins.indexOf(from) === -1 || text.indexOf('!') !== 0) {
    return;
  }

  plugin = new this.plugins[this.adminCommands[command]]();
  plugin[command](this.adminSandbox.bot, to, from, args.join(' '), function(err) {
    if (err) {
      console.log('Error!', err);
      return;
    }
    console.log('Successfully executed ' + command);
  });
};


/*
 * Given a message, see if we have any loaded plugins that register
 * a command for the message. Commands start with !.
 */
TreslekBot.prototype.executeCommands = function(from, to, text, msg) {
  var command, plugin;

  if (text.indexOf('!') !== 0) {
    return;
  }

  text = text.split(' ');
  command = text.shift().slice(1);

  if (!this.registeredCommands.hasOwnProperty(command)) {
    return;
  }

  plugin = new this.plugins[this.registeredCommands[command]]();
  plugin[command](this.sandbox.bot, to, from, text.join(' '), function(err) {
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
    plugin[hook](that.sandbox.bot, to, from, text, function(err) {
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
 * Log a message to redis
 */
TreslekBot.prototype.logMessage = function(from, to, text, msg) {
  var that = this,
      logCount = sprintf('%s:logs:id', that.conf.redis.prefix),
      logStore = sprintf('%s:logs:%s', that.conf.redis.prefix, to);

  async.auto({
    'logId': function(callback) {
      that.redis.incr(logCount, function(err, reply) {
        if (err) {
          console.log("Error retrieving log id", err);
          callback(err);
          return;
        }
        callback(null, reply);
      });
    },

    'createLog': ['logId', function(callback, results) {
      var hashKey = sprintf('%s:logs:%s', that.conf.redis.prefix, results.logId),
          logObj;

      logObj = {
        time: new Date().getTime().toString(),
        from: from,
        to: to,
        msg: text
      };

      that.redis.hmset(hashKey, logObj, function(err, reply){
        if (err) {
          console.log('Error creating log.', err);
          callback(err);
          return;
        }

        callback(null, results.logId);
      });
    }],

    'saveLog': ['createLog', function(callback, results) {
      async.parallel([
        function (callback) {
          that.redis.lpush(logStore, results.logId, function(err, reply) {
            if (err) {
              console.log('Error saving log', err);
              callback(err);
              return;
            }

            callback();
          });
        },

        function (callback) {
          that.redis.lpush(sprintf('%s:%s', logStore, from), results.logId, function(err, reply) {
            if (err) {
              console.log('Error saving user log', err);
              callback(err);
              return;
            }

            callback();
          });
        }
      ], callback);
    }]
  });
};


/*
 * Load a plugin, and register its commands and hooks.
 */
TreslekBot.prototype.loadPlugin = function(pluginFile, callback) {
  var plugin,
      usageKey,
      that = this;

  try {
    if (require.cache.hasOwnProperty(pluginFile)) {
      delete require.cache[require.resolve(pluginFile)];
    }
    var pluginModule = require(pluginFile).Plugin;
    this.plugins[pluginFile] = pluginModule;

    plugin = new pluginModule();

    if (plugin.hasOwnProperty('auto')) {
      plugin.auto.forEach(function(task) {
        plugin[task](that.sandbox.bot);
      });
    }

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

    if (plugin.hasOwnProperty('usage')) {
      for (usageKey in plugin.usage) {
        if (plugin.usage.hasOwnProperty(usageKey)) {
          that.commandUsage[usageKey] = plugin.usage[usageKey];
        }
      }
    }
    that.sandbox.update(Object.keys(that.registeredCommands), that.commandUsage);
  } catch (err) {
    console.log('Error loading plugin: ', {plugin: plugin, err: err});
    callback(err);
    return;
  }

  callback();
};


/*
 * Unload a plugin and unregister all commands, hooks, and usage.
 */
TreslekBot.prototype.unloadPlugin = function(pluginFile, callback) {
  var that = this,
      plugin = new that.plugins[pluginFile](),
      usageKey;

  if (plugin.hasOwnProperty('commands')) {
    plugin.commands.forEach(function(command) {
      delete that.registeredCommands[command];
    });
  }

  if (plugin.hasOwnProperty('hooks')) {
    plugin.hooks.forEach(function(hook) {
      delete that.registeredHooks[hook];
    });
  }

  if (plugin.hasOwnProperty('usage')) {
    for (usageKey in plugin.usage) {
      if (plugin.usage.hasOwnProperty(usageKey)) {
        if (that.commandUsage.hasOwnProperty(usageKey)) {
          delete that.commandUsage[usageKey];
        }
      }
    }
  }

  delete that.plugins[pluginFile];
  delete require.cache[require.resolve(pluginFile)];

  that.sandbox.update(Object.keys(that.registeredCommands), that.commandUsage);
  callback();
};


/*
 * Reload a plugin. Unload it, and then load it again.
 */
TreslekBot.prototype.reloadPlugin = function(pluginFile, callback) {
  var that = this;

  that.unloadPlugin(pluginFile, function(err) {
    if (err) {
      console.log('Error unloading plugin.', err);
    }

    that.loadPlugin(pluginFile, callback);
  });
};


/*
 * Check for the plugins_dir specified in the config, and load all js
 * files located there as plugins.
 */
TreslekBot.prototype.loadPlugins = function(callback) {
  var that = this;

  fs.readdir(this.conf.plugins_dir, function(err, files) {
    if (err) {
      callback(err);
      return;
    }

    files.forEach(function(file) {
      // Only load js files
      if (file.slice(-3) === '.js') {
        that.loadPlugin(path.resolve(that.conf.plugins_dir, file.slice(0, -3)), function(err) {
          if (err) {
            console.log('Error: ' + err);
          }
        });
      }
    });
    callback();
  });
};


/*
 * Load the plugin at lib/admin.js.
 */
TreslekBot.prototype.loadAdminPlugin = function(callback) {

  var plugin,
      pluginFile = path.resolve(__dirname, 'admin'),
      that = this;

  try {
    if (require.cache.hasOwnProperty(pluginFile)) {
      delete require.cache[pluginFile];
    }
    var pluginModule = require(pluginFile).Plugin;
    this.plugins[pluginFile] = pluginModule;

    plugin = new pluginModule();

    if (plugin.hasOwnProperty('commands')) {
      plugin.commands.forEach(function(command) {
        that.adminCommands[command] = pluginFile;
      });
    }
  } catch (err) {
    console.log('Error loading plugin: ', {plugin: plugin, err: err});
  }

  callback();
};


exports.TreslekBot = TreslekBot;
