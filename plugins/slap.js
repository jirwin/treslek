/*
 * Slap plugin
 *   - slap: Slap people with fish.
 */
var Slap = function() {
  this.commands = ['slap'];
  this.usage = {
    slap: 'ex: !slap jirwin. Notify a user by hitting them with a fish.'
  };
};


/*
 * Slap command.
 */
Slap.prototype.slap = function(bot, to, from, msg, callback) {
  var victim = from;

  if (msg !== '') {
    victim = msg;
  }

  bot.action(to, 'slaps ' + victim + ' with a large trout.');
  callback();
}


exports.Plugin = Slap;
