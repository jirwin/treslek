var request = require('request');
var sprintf = require('sprintf').sprintf;
var async = require('async');

/*
 * DOGE Plugin, queries cryptsy for current 
 * doge/btc price
 */

var DOGE = function () {
    this.commands = ['doge'];
    this.usage = {
        doge: 'ex : !doge . Gets market prices for DOGE'
    };
};



/* Vicurex 1 / value
 * https://api.vircurex.com/api/get_last_trade.json?base=BTC&alt=DOGE
 *  1 / value
 */
var VICUREX = function (callback) {
    var url = 'https://api.vircurex.com/api/get_last_trade.json?base=BTC&alt=DOGE';
    var label = 'Vicurex';
    var value;

    request(url, function (err, res, body) {
        if (!body) {
            value = 'such no body';
        } else {
            try {
                data = JSON.parse(body);
                value = (1 / data.value).toPrecision(3);
            } catch (err) {
                value = 'Response very confuse';
            }
        }
        callback(null, [label, value]);
    });
};

/* Coinex
 * https://coinex.pw/api/v2/trade_pairs
 * need pair 46
 * last_price / 100000000
 */
var COINEX = function (callback) {
    var url = 'https://coinex.pw/api/v2/trade_pairs';
    var label = 'Coinex';
    var value;

    request(url, function (err, res, body) {
        if (!body) {
            value = 'such no body';
        } else {
            try {
                data = JSON.parse(body);
                data.trade_pairs.forEach(function (each) {
                    if (each.id == 46) {
                        value = each.last_price / 100000000;
                    }
                });
            } catch (err) {
                value = 'Response very confuse';
            }
        }
        callback(null, [label, value]);
    });
};

/* Cryptsy
 * http://pubapi.cryptsy.com/api.php?method=singlemarketdata&marketid=132
 *
 */
var CRYPTSY = function (callback) {
    var url = 'http://pubapi.cryptsy.com/api.php?method=singlemarketdata&marketid=132';
    var label = 'Cryptsy';
    var value;

    request(url, function (err, res, body) {
        if (!body) {
            value = 'such no body';
        } else {
            try {
                data = JSON.parse(body);
                value = data.return.markets.DOGE.lasttradeprice;
            } catch (err) {
                value = 'Response very confuse';
            }
        }
        callback(null, [label, value]);
    });
};

/*
 * primary doge command
 */

DOGE.prototype.doge = function (bot, to, from, msg, callback) {
    var msgOut = '';
    async.parallel([CRYPTSY, COINEX, VICUREX], function (err, results) {
       msgOut += "DOGE: ";
       results.forEach(function (each) {
           msgOut += each[0] + ": " + each[1] + " "
       });

       bot.say(to, msgOut);
       callback();
    });
};

exports.Plugin = DOGE;