var path = require('path');
var async = require('async');
var sprintf = require('sprintf').sprintf;
var _ = require('underscore');

/*
 * Sandbox - A stripped down object of things that plugins can perform.
 * This object will be passed to plugins on command and hook execution.
 */
Sandbox = function(conf, irc, redis, commands, usage) {

  this.bot = {
    say: function(to, msg) {
      irc.say(to, msg);
    },

    action: function(to, msg) {
      irc.action(to, msg);
    },

    inject: irc.treslekProcessMessage,

    topic: function(to, msg) {
      irc.send('TOPIC', to, msg);
    },

    getTopic: function(channel, callback){
      var topicStore = sprintf('%s:topic:%s', conf.redis.prefix, channel);
      redis.get(topicStore, callback);
    },

    getLogs: function(channel, count, user, callback) {
      var logStore = sprintf('%s:logs:%s', conf.redis.prefix, channel),
          logs = [],
          logCount = count;

      if (!logCount) {
        logCount = 50;
      }

      if (user) {
        logStore += sprintf(":%s", user);
      }

      async.waterfall([
        function getLogIds(callback) {
          redis.lrange(logStore, 0, logCount - 1, function(err, replies) {
            if (err) {
              console.log('Error retrieving logs', err);
              callback(err);
              return;
            }

            replies.forEach(function(logId) {
              logs.push(logId);
            });

            callback(null, logs);
          });
        },

        function getLogObjs(logs, callback) {
          async.mapSeries(
            logs,

            function(logId, callback) {
              redis.hgetall(sprintf('%s:logs:%s', conf.redis.prefix, logId), function(err, obj) {
                if (err) {
                  console.log('Error retrieving log hash', err);
                  callback(err);
                  return;
                }

                callback(null, obj);
              });
            },

            function(err, results) {
              if (err) {
                console.log('Error grabbing logs.', err);
                callback(null, []);
                return;
              }
              callback(null, results);
            }
          );
        }
      ],

      function(err, results) {
        if (err) {
          console.log('Error getting logs.', err);
          callback(err);
          callback(null, []);
        }

        callback(null, results);
      });
    },

    redisConf: _.clone(conf.redis),

    commands: commands,

    config: {
      nick: conf.nick,
      topics: conf.topics
    },

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
