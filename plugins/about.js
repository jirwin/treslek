/*
 * About plugin
 *  - about: Displays basic info about the bot.
 */
var About = function() {
  this.commands = ['about'];
};


/*
 * About command.
 */
About.prototype.about = function(bot, to, from, msg, callback) {
  bot.say(to, 'Treslek was written and is maintained by Justin Gallardo <justin.gallardo@gmail.com>');
  callback();
};


exports.Plugin = About;
