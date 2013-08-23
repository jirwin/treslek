var redis = require('redis');
var qs = require('querystring');
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
        payload = JSON.parse(qs.parse(message).payload);

    bot.say(ircChannel, '');
  });
};

exports.Plugin = Github;
