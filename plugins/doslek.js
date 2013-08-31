/*
 * Doslek legacy plugin
 *  - clipboard check hook
 */
var Doslek = function() {
  this.hooks = ['clipboard'];
};


/**
 * Clipboard Check
 */
Doslek.prototype.clipboard = function(bot, to, from, msg, callback) {
  var random = Math.floor(Math.random() * 1000);

  if (random === 42) {
    bot.say(to, '*** CLIPBOARD CHECK ***');
  }
  callback();
};


exports.Plugin = Doslek;
