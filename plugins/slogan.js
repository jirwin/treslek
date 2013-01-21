var request = require('request');

/*
 * Slogan plugin
 *   - slogan: Sloganize things!
 */
var Slogan = function() {
  this.commands = ['slogan'];
};


/*
 * Slogan command.
 *   Makes a request to sloganizer to get a slogan.
 */
Slogan.prototype.slogan = function(bot, to, from, msg, callback) {
  var sloganizer = "http://www.sloganizer.net/en/outbound.php?slogan=" + encodeURIComponent(msg);

  request(sloganizer, function(err, res, body) {
    var response;

    if (err || res.statusCode !== 200) {
      bot.say(to, from + ": Sloganizer didn't have much to say");
      callback();
      return;
    }

    response = body.replace(/<a[^>]+>/, '').replace(/<\/a>/, '');
    bot.say(to, from + ": " + response);
    callback();
  });
};


exports.Plugin = Slogan;
