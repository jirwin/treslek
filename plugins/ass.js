var sprintf = require('sprintf').sprintf


var ASS_REGEX = /(\w+)-ass (\w+)/i;

/*
 * Ass plugin
 *   - ass hook: https://xkcd.com/37
 */
var Ass = function() {
  this.hooks = ['ass'];
};


/*
 * Ass hook
 */
Ass.prototype.ass = function(bot, to, from, msg, callback) {
  var matches = msg.match(ASS_REGEX),
      replacement, newMsg;

  if (!matches) {
    callback();
    return;
  }

  replacement = sprintf('%s ass-%s', matches[1], matches[2]);

  newMsg = sprintf("%s%s%s", msg.slice(0, matches.index),
                             replacement,
                             msg.slice(matches.index + replacement.length));

  bot.say(to, sprintf('%s meant to say: %s', from, newMsg));
  callback();
};


exports.Plugin = Ass;
