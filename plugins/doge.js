var request = require('request');
var async = require('async');

/*
 * DOGE Plugin, queries cryptsy for current 
 * doge/btc price
 */

var DOGE = function () {
  this.commands = ['doge', 'btc', 'dc', 'bc'];
  this.usage = {
    doge: 'ex : !doge . Gets market prices for DOGE',
    btc: 'ex : !btc . Gets market prices for BTC',
    dc: 'ex : !dc <amount>. Convert DOGE to USD, default 1000',
    bc: 'ex : !bc <amount>. Convert BTC to USD, default 1'
  };
};


var FETCH_PRICE = function(callback, name) {
  var retObj = { label: name };

  retObj.symbol = PROVIDERS[name].symbol ? PROVIDERS[name].symbol : 'Ֆ';

  request(PROVIDERS[name].url, function(err, res, body) {
    if (!body) {
      retObj.value = 'such no body';
    } else {
      try {
        retObj.value = PROVIDERS[name].valueFunction(JSON.parse(body));
      } catch (exception) {
        retObj.value = 'very confuse';
      }
    }
    callback(null, retObj);
  });
};

/* 
 * List of exchanges, with their respective URLs and JSON reading functions
 */
var PROVIDERS = {
  Vicurex: {
    url: 'https://api.vircurex.com/api/get_last_trade.json?base=BTC&alt=DOGE',
    valueFunction: function(data) {
      return Math.floor((1 / data.value) * 100000000);
    }
  },
  CoinEx: {
    url: 'https://coinex.pw/api/v2/trade_pairs',
    valueFunction: function(data) {
      var last_price;
      data.trade_pairs.forEach(function(each) {
        if (each.id === 46) {
          last_price = each.last_price;
        }
      });
      return last_price;
    }
  },
  Cryptsy: {
    url: 'http://pubapi.cryptsy.com/api.php?method=singlemarketdata&marketid=132',
    valueFunction: function(data) {
      return Math.round(data.return.markets.DOGE.lasttradeprice * 100000000);
    }
  },
  Coinbase: {
    url: 'https://coinbase.com/api/v1/prices/sell',
    valueFunction: function(data) {
      return data.amount;
    }
  },
  'Vault of Satoshi': {
    url: 'https://api.vaultofsatoshi.com/public/ticker?order_currency=DOGE&payment_currency=USD',
    valueFunction: function(data) {
      return data.data.average_price.value;
    },
    symbol: '$'
  }
};

var eachProvider = function(providers, callback) {
  async.parallel(providers.map(function(name) {
    return function(callback) {
      FETCH_PRICE(callback, name);
    };
  }), callback);
};

/*
 * primary doge command
 */
DOGE.prototype.doge = function (bot, to, from, msg, callback) {
  var msgOut = '',
      providers = [];

  providers = [
    'Cryptsy',
    'CoinEx',
    'Vicurex',
    'Vault of Satoshi'
  ];

  eachProvider(providers, function(err, results) {
    msgOut += "DOGE: ";
    results.forEach(function (each) {
      msgOut += each.label + ": " + each.symbol + each.value + " ";
    });

    bot.say(to, msgOut);
    callback();
  });
};

DOGE.prototype.btc = function (bot, to, from, msg, callback) {
  var msgOut = '';
  eachProvider(['Coinbase'], function(err, results) {
    msgOut += "BTC: ";
    results.forEach(function (each) {
      msgOut += each.label + ": " + each.value + " ";
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

  if ((raw !== '') && !isNaN(raw)) {
    amount = parseFloat(raw);
  }

  eachProvider(['Vault of Satoshi'], function(err, results) {
    if (isNaN(results[0].value)) {
      msgOut = 'Cannot do conversion at this moment.';
    } else {
      msgOut = 'Đ' + amount + ' is $' + (amount * results[0].value).toFixed(2);
    }
    bot.say(to, msgOut);
    callback();
  });
};

DOGE.prototype.bc = function (bot, to, from, msg, callback)
{
  var msgOut = '',
    amount = 1,
    raw = msg.replace(',', '');

  if ((raw !== '') && !isNaN(raw)) {
    amount = parseFloat(raw);
  }

  eachProvider(['Coinbase'], function(err, results) {
    if (isNaN(results[0].value)) {
      msgOut = 'Cannot do conversion at this moment.';
    } else {
      msgOut = 'BTC' + amount + ' is $' + (amount * results[0].value).toFixed(2);
    }
    bot.say(to, msgOut);
    callback();
  });
};

exports.Plugin = DOGE;
