var redis = require('redis');
var async = require('async');
var sprintf = require('sprintf').sprintf;
/*
 * Topic plugin
 *    - topic: Sets the topic to a random saved topic
 */
var Topic = function () {
  this.commands = ['topic'];
  this.usage = {
    topic: 'Sets the channel topic.'
  };
};


/*
 * Topic command
 */
Topic.prototype.topic = function(bot, to, from, msg, callback) {
  var args = require('argsparser').parse(msg.split(' ')),
      addTopic = args['--add'],
      appendTopic = args['--append'],
      topicCount = sprintf('%s:topics:id', bot.redisConf.prefix),
      rc = redis.createClient(bot.redisConf.port, bot.redisConf.host),
      topicPrefix = bot.config.topics.prefixes[to],
      separator = bot.config.topics.separator;

  if (addTopic) {
    addTopic = addTopic instanceof Array ? addTopic : [addTopic];
    async.auto({
      'topicId': function(callback) {
        rc.incr(topicCount, callback);
      },
      'addTopic': ['topicId', function(callback, results) {
        var topicId = results.topicId,
            topicStore = sprintf('%s:topics:%s', bot.redisConf.prefix, topicId),
            channelTopics = sprintf('%s:topics:%s', bot.redisConf.prefix, to);

        async.waterfall([
          function create(callback) {
            rc.set(topicStore, addTopic);
            callback();
          },

          function addToChannel(callback) {
            rc.sadd(channelTopics, topicId);
            callback();
          },

          function setTopic(callback) {
            addTopic.unshift(topicPrefix, separator);
            bot.topic(to, addTopic.join(' '));
            callback();
          }

        ], callback);
      }]
    });
  } else if (appendTopic) {
    if (appendTopic instanceof Array) {
      appendTopic.unshift(separator);
    } else {
      appendTopic = [separator, appendTopic];
    }
    async.waterfall([
      bot.getTopic.bind(null, to),
      function(topic, callback) {
        bot.topic(to, sprintf('%s %s %s %s', topicPrefix, separator, topic, appendTopic.join(' ')));
      }
    ], callback);
  } else {
    if (msg) {
      bot.topic(to, [topicPrefix, separator, msg].join(' '));
      callback();
    } else {
      async.waterfall([
        function(callback) {
          var channelTopics = sprintf('%s:topics:%s', bot.redisConf.prefix, to);
          rc.srandmember(channelTopics, callback);
        },

        function(topicId, callback) {
          var topic = sprintf('%s:topics:%s', bot.redisConf.prefix, topicId);
          rc.get(topic, callback);
        },

        function(topic, callback) {
          bot.topic(to, [topicPrefix, separator, topic].join(' '));
          callback();
        }

      ], callback);
    }
  }
};


exports.Plugin = Topic;
