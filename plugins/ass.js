var sprintf = require('sprintf').sprintf


/*
 * Ass plugin
 *   - ass hook: https://xkcd.com/37
 */
var Ass = function() {
  this.hooks = ['ass'];
};


var ASS_REGEX = /(\w+)-ass (\w+)/i;

/*
 * Ass hook
 */
Ass.prototype.ass = function(bot, to, from, msg, callback) {
  var matches = msg.match(ASS_REGEX);

  if (!matches) {
    callback();
    return;
  }

  bot.say(to, sprintf('%s meant to say: %s ass-%s', from, matches[1], matches[2]));
  callback();
};


exports.Plugin = Ass;
