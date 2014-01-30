var request = require('request');
var sprintf = require('sprintf').sprintf;

/*
 * DOGE Plugin, queries cryptsy for current 
 * doge/btc price
 */

var DOGE = function() {
  this.commands = ['doge'];
  this.usage = {
      doge: 'ex : !doge . Gets the current cryptsy price of DOGE'
  };
};

/*
 * primary doge command
 */

DOGE.prototype.doge = function(bot, to, from, msg, callback) {
  var msgOut = '';
  url = 'http://pubapi.cryptsy.com/api.php?method=singlemarketdata&marketid=132';
  request(url, function(err, res, body) {
      if (!body) {
	  bot.say(to, 'Unable to retreive DOGE price');
          callback();
          return;
      }
      
      data = JSON.parse(body);
      msgOut = sprintf(
        'Cryptsy price: %s %s',
	data.return.markets.DOGE.lasttradeprice,
	data.return.markets.DOGE.label
      );

      bot.say(to, msgOut);
      callback();
    });
};

exports.Plugin = DOGE;