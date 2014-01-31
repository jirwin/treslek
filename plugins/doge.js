var request = require('request');
var sprintf = require('sprintf').sprintf;
var async = require('async');

/*
 * DOGE Plugin, queries cryptsy for current 
 * doge/btc price
 */

var DOGE = function () {
    this.commands = ['doge', 'btc', 'dc'];
    this.usage = {
        doge: 'ex : !doge . Gets market prices for DOGE',
        btc: 'ex : !btc . Gets market prices for BTC',
        dc: 'ex : !dc <amount>. Convert DOGE to USD, default 1000'
    };
};


/* Vicurex 1 / value
 * https://api.vircurex.com/api/get_last_trade.json?base=BTC&alt=DOGE
 *  1 / value
 */
var VICUREX = function (callback) {
    var url = 'https://api.vircurex.com/api/get_last_trade.json?base=BTC&alt=DOGE',
        retObj = {};
    retObj.label = 'Vicurex';

    request(url, function(err, res, body) {
        if (!body) {
            retObj.value = 'such no body';
        } else {
            try {
                data = JSON.parse(body);
                retObj.value = (1 / data.value).toPrecision(3);
            } catch (err) {
                retObj.value = 'very confuse';
            }
        }
        callback(null, retObj);
    });
};

/* Coinex
 * https://coinex.pw/api/v2/trade_pairs
 * need pair 46
 * last_price / 100000000
 */
var COINEX = function (callback) {
    var url = 'https://coinex.pw/api/v2/trade_pairs',
        retObj = {};
    retObj.label = 'Coinex';

    request(url, function(err, res, body) {
        if (!body) {
            retObj.value = 'such no body';
        } else {
            try {
                data = JSON.parse(body);
                data.trade_pairs.forEach(function(each) {
                    if (each.id === 46) {
                        retObj.value = each.last_price / 100000000;
                    }
                });
            } catch (err) {
                retObj.value = 'very confuse';
            }
        }
        callback(null, retObj);
    });
};

/* Cryptsy
 * http://pubapi.cryptsy.com/api.php?method=singlemarketdata&marketid=132
 *
 */
var CRYPTSY = function (callback) {
    var url = 'http://pubapi.cryptsy.com/api.php?method=singlemarketdata&marketid=132',
        retObj = {};
    retObj.label = 'Cryptsy';

    request(url, function(err, res, body) {
        if (!body) {
            retObj.value = 'such no body';
        } else {
            try {
                data = JSON.parse(body);
                retObj.value = data.return.markets.DOGE.lasttradeprice;
            } catch (err) {
                retObj.value = 'very confuse';
            }
        }
        callback(null, retObj);
    });
};

var MTGOX = function (callback) {
    var url = 'http://data.mtgox.com/api/2/BTCUSD/money/ticker_fast',
        retObj = {};
    retObj.label = 'MtGox';

    request(url, function(err, res, body) {
        if (!body) {
            retObj.value = 'such no body';
        } else {
            try {
                data = JSON.parse(body);
                retObj.value = data.data.sell.value;
            } catch (err) {
                retObj.value = 'very confuse';
            }
        }
        callback(null, retObj);
    });
};

var COINBASE = function (callback) {
    var url = 'https://coinbase.com/api/v1/prices/sell',
        retObj = {};
    retObj.label = 'Coinbase';

    request(url, function(err, res, body) {
        if (!body) {
            retObj.value = 'such no body';
        } else {
            try {
                data = JSON.parse(body);
                retObj.value = data.amount;
            } catch (err) {
                retObj.value = 'very confuse';
            }
        }
        callback(null, retObj);
    });
};

/*
 * primary doge command
 */

DOGE.prototype.doge = function (bot, to, from, msg, callback) {
    var msgOut = '';
    async.parallel([CRYPTSY, COINEX, VICUREX], function(err, results) {
        msgOut += "DOGE: ";
        results.forEach(function (each) {
            msgOut += each.label + ": " + each.value + " "
        });

        bot.say(to, msgOut);
        callback();
    });
};

DOGE.prototype.btc = function (bot, to, from, msg, callback) {
    var msgOut = '';
    async.parallel([MTGOX, COINBASE], function(err, results) {
        msgOut += "BTC: ";
        results.forEach(function (each) {
            msgOut += each.label + ": " + each.value + " "
        });

        bot.say(to, msgOut);
        callback();
    });
};

DOGE.prototype.dc = function (bot, to, from, msg, callback)
{
    var msgOut = '',
        amount = 1000,
        raw = msg.replace(',', '');

    if (!(raw === '') && !isNaN(raw))
    {
        amount = parseFloat(raw);
    }

    async.parallel([CRYPTSY, COINBASE], function(err, results) {
        if (isNaN(results[0].value)) {
            msgOut = 'Cannot do conversion at this moment.';
        } else {
            msgOut = 'Đ' + amount + ' is $' + ((amount * results[0].value) * results[1].value).toFixed();
        }
        bot.say(to, msgOut);
        callback();
    });
};

exports.Plugin = DOGE;