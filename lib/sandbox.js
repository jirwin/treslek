var path = require('path');
var async = require('async');
var sprintf = require('sprintf').sprintf;
var redis = require('redis');
var _ = require('underscore');

var log = require('logmagic').local('treslek.lib.sandbox');

/*
 * Sandbox - A stripped down object of things that plugins can perform.
 * This object will be passed to plugins on command and hook execution.
 */
var Sandbox = function(conf, irc, redisClient, commands, usage) {

  this.bot = {
    say: function(to, msg) {
      irc.say(to, msg);
    },

    action: function(to, msg) {
      irc.action(to, msg);
    },

    whois: function(nick, callback) {
      irc.whois(nick, callback);
    },

    inject: irc.treslekProcessMessage,

    topic: function(to, msg) {
      irc.send('TOPIC', to, msg);
    },

    getWebhookChannel: function() {
      return [conf.redis.prefix, conf.webhook.channelKey].join(':');
    },

    getTopic: function(channel, callback){
      var topicStore = sprintf('%s:topic:%s', conf.redis.prefix, channel);
      redisClient.get(topicStore, callback);
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
          redisClient.lrange(logStore, 0, logCount - 1, function(err, replies) {
            if (err) {
              log.error('Error retrieving logs', {err: err});
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
              redisClient.hgetall(sprintf('%s:logs:%s', conf.redis.prefix, logId), function(err, obj) {
                if (err) {
                  log.error('Error retrieving log hash.', {err: err});
                  callback(err);
                  return;
                }

                callback(null, obj);
              });
            },

            function(err, results) {
              if (err) {
                log.error('Error grabbing logs', {err: err});
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
          log.error('Error grabbing logs', {err: err});
          callback(err);
          callback(null, []);
        }

        callback(null, results);
      });
    },

    redisConf: _.clone(conf.redis),

    getRedisClient: function() {
      var rc;

      try {
        rc = redis.createClient(conf.redis.port, conf.redis.host);
      } catch (e) {
        log.error('Unable to create redis client.', {err: e});
        rc = null;
      }

      return rc;
    },

    commands: commands,

    config: {
      nick: conf.nick,
      topics: conf.topics,
      commandPrefix: conf.commandPrefix
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
var AdminSandbox = function(treslek) {
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

    whois: function(nick, callback) {
      treslek.irc.whois(nick, callback);
    },

    load: function(plugin, callback) {
      var pluginFile = path.resolve(treslek.conf.plugins_dir, plugin);

      treslek.loadPlugin(pluginFile, function(err) {
        callback(err);
      });
    },
    reload: function(plugin, callback) {
      var pluginFile = path.resolve(treslek.conf.plugins_dir, plugin);

      if (!treslek.plugins.hasOwnProperty(pluginFile)) {
        callback('Unknown plugin: ' + plugin);
        return;
      }

      treslek.reloadPlugin(pluginFile, function(err) {
        callback(err);
      });
    },
    unload: function(plugin, callback) {
      var pluginFile = path.resolve(treslek.conf.plugins_dir, plugin);

      if (!treslek.plugins.hasOwnProperty(pluginFile)) {
        callback('Unknown plugin: ' + plugin);
        return;
      }

      treslek.unloadPlugin(pluginFile, function(err) {
        callback(err);
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
