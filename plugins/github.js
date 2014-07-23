var redis = require('redis');
var sprintf = require('sprintf').sprintf;
var redisClient;

var Github = function() {
  this.auto = ['listen'];
};

Github.prototype.listen = function(bot) {
  
  redisClient = redis.createClient(bot.redisConf.port, bot.redisConf.host);

  var pattern = [bot.redisConf.prefix, 'github/*'].join(':');

  redisClient.on("pmessage", function(pattern, channel, message) {
    var channelPath = channel.slice(bot.redisConf.prefix.length + 1).split('/')[1];
    var realChannel = bot.config.github.channels[channelPath];
    var data = JSON.parse(message);
    var output;

    if (data) {
      if (data.action === "created") {
        if (data.comment) {
          output = sprintf("New comment on PR: %s by %s \"%s\"", 
			   data.pull_request.html_url, data.comment.user.login, data.comment.body);
        }
      } else if (data.action === "opened") {
        output = sprintf("New PR \"%s\" by %s at %s comment: %s",
	  data.pull_request.title,  data.pull_request.user.login,
	  data.pull_request.html_url, data.pull_request.body);
      } else if (data.action === "closed") {
        output = sprintf("PR %s closed by %s", data.number, data.pull_request.merged_by.login);
      }
    }

    if (output) {
      bot.say(realChannel, output);
    }
  });
  redisClient.psubscribe(pattern);
};

exports.Plugin = Github;
