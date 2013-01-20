/*
 * Echo plugin
 *   - echo: Repeats whatever is passed with the command
 */
var Echo = function() {
  this.commands = ['echo'];
  this.usage = {
    echo: 'Echoes back any text you send in the command.'
  };
};


/*
 * Echo command.
 */
Echo.prototype.echo = function(bot, to, from, msg, callback) {
  bot.say(to, msg);
  callback();
};


exports.Plugin = Echo;
