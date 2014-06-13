/*
 * wdyt plugin
 *  - about: Show a cool ascii face indicating what the bot thinks
 */

var cool = require('cool-ascii-faces');

var Wdyt = function() {
  this.commands = ['wdyt'];
  this.usage = {
    wdyt: 'Find out what the bot thinks'
  };
};


/*
 * About command.
 */
Wdyt.prototype.wdyt = function(bot, to, from, msg, callback) {
  bot.say(to, cool());
  callback();
};


exports.Plugin = Wdyt;
