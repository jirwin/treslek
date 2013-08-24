var redis = require('redis');
var qs = require('qs');
var sprintf = require('sprintf').sprintf;


var Github = function() {
  this.auto = ['listen'];
};


Github.prototype.listen = function(bot) {
  var redisClient = redis.createClient(bot.redisConf.port, bot.redisConf.host),
      listenPattern = [bot.redisConf.prefix, 'github/*'].join(':');

  redisClient.psubscribe(listenPattern);

  redisClient.on('pmessage', function(pattern, channel, message) {
    var realChannel = channel.slice(bot.redisConf.prefix.length - 1).split('/'),
        ircChannel = bot.config.github.channels[realChannel[1]],
        payload = JSON.parse(qs.parse(message).payload),
        msg = "I got something from github.";

    if (payload.action === 'opened') {
      msg = sprintf('%s opened a new PR at %s', payload.sender.login, payload.pull_request.url);
    }

    if (payload.action === 'reopened') {
      msg = sprintf('%s reopened a new PR at %s', payload.sender.login, payload.pull_request.url);
    }

    bot.say(ircChannel, msg);
  });
};

exports.Plugin = Github;
