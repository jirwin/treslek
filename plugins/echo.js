var Plugin = function() {
  this.commands = ['echo'];
  this.hooks = ['hook'];
};

Plugin.prototype.echo = function(bot, to, from, msg, callback) {
  bot.say(to, msg);
  callback();
};

Plugin.prototype.hook = function(bot, to, from, msg, callback) {
  console.log("Echo hook");
  callback();
}

exports.Plugin = Plugin;
