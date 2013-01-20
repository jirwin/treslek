var Plugin = function() {
  this.commands = ['echo'];
  this.hooks = [];
};

Plugin.prototype.echo = function(bot, to, from, msg, callback) {
  bot.say(to, msg);
  callback();
};

exports.Plugin = Plugin;
