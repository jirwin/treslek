/*
 * About plugin
 *  - about: Displays basic info about the bot.
 */
var About = function() {
  this.commands = ['about'];
  this.usage = {
    about: 'Displays basic info about the bot.'
  };
};


/*
 * About command.
 */
About.prototype.about = function(bot, to, from, msg, callback) {
  bot.say(to, 'Treslek: Created by Justin Gallardo <justin.gallardo@gmail.com>.');
  bot.say(to, 'Treslek is available from https://github.com/jirwin/treslek.');
  callback();
};


exports.Plugin = About;
