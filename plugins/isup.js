var request = require('request');


/*
 * Isup plugin
 *   - isup: Checks isup.me to see if a website is up or down
 */
var Isup = function() {
  this.commands = ['isup'];
  this.usage = {
    isup: 'ex: !isup google.com :Checks isup.me to see if a url is up or down.'
  };
};


/*
 * Isup command
 */
Isup.prototype.isup = function(bot, to, from, msg, callback) {
  var url;

  if (msg === '') {
    bot.say(to, 'I need a URL to check');
    callback();
    return;
  }

  url = msg.replace(/^http:\/\//, '');

  request('http://isup.me/' + url, function (error, response, body) {
    if (error || response.statusCode !== 200) {
      bot.say(to, 'Something is wrong with isup.me.');
      callback();
      return;
    }

    if (!error && response.statusCode === 200) {
      if (body.search('is up') !== -1) {
        response = "Hooray! " + msg + ' looks good to me.';
      } else if (body.search('Huh') !== -1) {
        response = "Har Har. " + msg + " doesn't look like a website to me.";
      } else if (body.search('down from here') !== -1) {
        response = "Oh no! " + msg + " is broken.";
      }

      bot.say(to, response);
      callback();
    }
  });
};


exports.Plugin = Isup;
