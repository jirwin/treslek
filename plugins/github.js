var redis = require('redis');


var Github = function() {
  this.auto = ['listen'];
};

Github.prototype.listen = function(bot) {
  var redisClient = redis.createClient(bot.redisConf.port, bot.redisConf.host),
      pattern = [bot.redisConf.prefix, 'github/*'].join(':');

  redisClient.on('message', function(channel, message) {
    var realChannel = channel.slice(bot.redisConf.prefix.length - 1).split('/'),
        ircChannel = bot.config.github[realChannel];

    bot.say(realChannel, 'I got a message from github.');
  });
  redisClient.psubscribe(pattern);
};

export.Plugin = Github;
