var async = require('async');

/*
 * Help plugin
 *  - help: Displays available commands and their usage
 */
var Help = function() {
  this.commands = ['help'];
  this.usage = {
    help: ['Displays helpful information. With no arguments, it will display all available commands.',
           'Returns usage information for a given command if passed one e.g. !help help.'].join(' ')
  };
};


/*
 * Help command. With no options it displays available commands. If you
 * specify a command, it will out put the usage info if available.
 */
Help.prototype.help = function(bot, to, from, msg, callback) {
  var response;

  if (msg === '') {
    response = 'Available commands: ' + bot.commands.join(', ');
  } else if (bot.usage.hasOwnProperty(msg) && bot.usage[msg] === '') {
    response = "I don't have help information for " + msg;
  } else if (bot.usage.hasOwnProperty(msg)) {
    response = bot.usage[msg] instanceof Array ? bot.usage[msg] : [bot.usage[msg]];
    async.each(response, function(item, callback) {
      bot.say(to, item);
    }, callback);
    return;
  } else {
    response = "I don't know about the command: " + msg;
  }

  bot.say(to, response);
  callback();
};


exports.Plugin = Help;
