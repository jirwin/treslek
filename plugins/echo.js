/*
 * Echo plugin
 *   - echo: Repeats whatever is passed with the command
 */
var Echo = function() {
  this.commands = ['echo'];
};


/*
 * Echo command.
 */
Echo.prototype.echo = function(bot, to, from, msg, callback) {
  bot.say(to, msg);
  callback();
};


exports.Plugin = Echo;
