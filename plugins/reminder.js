/*
 * Reminder plugin
 *   - remindme: Sets a timer and reminds you to do something after n minutes
 */
var Reminder = function() {
  this.commands = ['remindme'];
};


/*
 * Remindme command. Given a number of minutes, remind the user of some
 * task after the allotted time.
 */
Reminder.prototype.remindme = function(bot, to, from, msg, callback) {
  var reminder = from + ': Time is up!',
      duration;

  msg = msg.split(' ');

  if (msg.length === 1 && msg[0] === '') {
    bot.say(to, 'Please specify a time in minutes and a reminder.');
    callback();
    return;
  }

  if (msg.length >= 1 && isNaN(parseInt(msg[0]))) {
    bot.say(to, 'Please specify a time in minutes.');
    callback();
    return;
  }

  duration = parseFloat(msg[0]) * 1000 * 60;
  if (msg.length > 1) {
    reminder += ' ' + msg.slice(1).join(' ');
  }

  bot.say(to, from + ": I'll remind you in " + duration / 1000 / 60 + " minutes.");
  setTimeout(function() {
    bot.say(to, reminder);
    callback();
  }, duration);
};


exports.Plugin = Reminder;
