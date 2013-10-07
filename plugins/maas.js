var redis = require('redis');


var Maas = function() {
  this.auto = ['listen'];
};

Maas.prototype.listen = function(bot) {
  var redisClient = redis.createClient(bot.redisConf.port, bot.redisConf.host),
      pattern = [bot.redisConf.prefix, 'cm/*'].join(':');

  console.log(pattern);

  redisClient.on('message', function(channel, message) {
    var realChannel = channel.slice(bot.redisConf.prefix.length - 1).split('/'),
        ircChannel = bot.config.cm[realChannel];

    console.log(realChannel);
    console.log(ircChannel);

    bot.say(realChannel, 'I got a message from cm');
  });
  redisClient.psubscribe(pattern);
};

exports.Plugin = Maas;
