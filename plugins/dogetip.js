var request = require('request');
var sprintf = require('sprintf').sprintf;
var async = require('async');
var _ = require('underscore');

var log = require('logmagic').local('treslek.plugins.dogetip');

/**
 * https://en.bitcoin.it/wiki/Original_Bitcoin_client/API_Calls_list
 */
var DogeClient = function (conf) {
  this.conf = conf;
};

DogeClient.prototype.send = function (command, params, callback) {

  if (!_.isArray(params)) {
    params = [];
  }

  var options = {},
    body = {};

  body = {
    id: Date.now().toString(),
    method: command,
    params: params
  };

  options = {
    url: this.conf.url,
    body: JSON.stringify(body),
    method: 'POST',
    auth: {
      user: this.conf.rpcuser,
      pass: this.conf.rpcpassword,
      sendImmediately: true
    }
  };

  log.info('dogetip request', {options: options});

  request(options, function (error, response, body) {

    if (error) {
      log.error('dogetip request error', {err: error});
      callback(error);
      return;
    }

    if (response.statusCode !== 200) {
      log.error('dogtip unexpected status code', {statusCode: response.statusCode});
      callback('dogetip: unexpected status code - ', response.statusCode);
      return;
    }

    try {

      body = JSON.parse(body);

      if (body.error) {
        log.error('dogtip rpc error', {err: body.error});
        callback(body.error);
        return;
      } else {
        log.info('dogetip rpc response', {body: body});
        callback(null, body.result);
        return;
      }
    } catch (exception) {
      log.error('dogetip rpc response parse error', {err: exception});
      callback(exception);
      return;
    }
  });

};


/** Fetch a dogecoin address by name, create one if it doesn't exist */
DogeClient.prototype.getaddress = function (name, callback) {
  this.send('getaccountaddress', [name], callback);
};

/** Get a dogecoin address balance by name */
DogeClient.prototype.getbalance = function (name, callback) {
  this.send('getbalance', [name], callback);
};

/** Send doge to an address */
DogeClient.prototype.sendfrom = function (account, address, amount, callback) {
  this.send('sendfrom', [account, address, amount], callback);
};

/** Move doge between accounts in the wallet */
DogeClient.prototype.move = function (from, to, amount, callback) {
  this.send('move', [from, to, amount], callback);
};

/** Get dogecoind info */
DogeClient.prototype.getinfo = function (callback) {
  this.send('getinfo', [], callback);
};

DogeClient.prototype.listaccounts = function (callback) {
  this.send('listaccounts', [], callback);
};

DogeClient.prototype.listtransactions = function(account, callback) {

  var transactions = [],
    count = 100,
    from = 0,
    _fetch = function(err, response) {
    if (err) {
      return callback(err);
    } else {
      transactions = transactions.concat(response);
      if (response.length === count) {
        from += count;
        this.send('listtransactions', [account, count, from], _fetch);
      } else {
        callback(null, transactions);
      }
    }
  }.bind(this);

  this.send('listtransactions', [account, count, from], _fetch);
};

DogeClient.prototype.getinfo = function (callback) {
  this.send('getinfo', [], callback);
};


var DogeTip = function () {
  this.commands = ['dt', 'dtgamble'];
  this.usage = {
    dt: 'ex : !dt [tip <nick> <amt>] [sendto <address> <amd>] [address] [balance]'
  };
};

DogeTip.prototype.dt = function (bot, to, from, msg, callback) {

  var command, args;

  /** Split tokens and strip any whitespace */
  args = msg.split(" ");
  args = _.reject(args, function (val) {
    return (val === "");
  });
  command = args[0];
  args.shift();

  switch (command) {
    case 'address':
      this.getaddress(bot, to, from, args);
      break;
    case 'balance':
      this.getbalance(bot, to, from, args);
      break;
    case 'tip':
      this.tip(bot, to, from, args);
      break;
    case 'sendto':
      this.sendto(bot, to, from, args);
      break;
    case 'move':
      this.move(bot, to, from, args);
      break;
    case 'ledger':
      this.ledger(bot, to, from, args);
      break;
    case 'stats':
      this.stats(bot, to, from, args);
      break;
    case 'info':
      this.info(bot, to, from, args);
      break;
    default:
      args.unshift(command);
      this.tip(bot, to, from, args);
      break;

  }

  callback();
};

/** Check and see if a given nick is in a given channel.
 * Callback will fire with a boolean.
 */
DogeTip.prototype._inChannel = function (bot, nick, channel, callback) {
  bot.whois(nick, function (result) {
    var found = false;

    if (!_.has(result, 'channels')) {
      callback(null, false);
      return;
    }

    /** We have to strip the operator sign from the channel list */
    found = _.find(result.channels, function (c) {
      if (c.charAt(0) === '@') {
        c = c.substring(1);
      }
      return c === channel;
    });

    if (found) {
      callback(null, true);
      return;
    } else {
      callback(null, false);
      return;
    }
  });
};

/** Check and see if a given nick is an admin. */
DogeTip.prototype._isAdmin = function (bot, nick) {
  return _.contains(bot.pluginsConf.dogetip.admins, nick);
};

/** Validate DOGE amount */
DogeTip.prototype._isValidAmount = function (amt) {
  if (!_.isFinite(amt) || _.isNaN(amt) || amt <= 0.0) {
    return false;
  }
  return true;
};


/** Look up the tip wallet address for a nick */
DogeTip.prototype.getaddress = function (bot, to, from, args) {

  var dogeClient = new DogeClient(bot.pluginsConf.dogetip),
    nick;

  if (this._isAdmin(bot, from)) {
    nick = args.shift();
    if (_.isUndefined(nick)) {
      nick = from;
    }
  } else {
    nick = from;
  }

  dogeClient.getaddress(nick, function (err, result) {
    if (err) {
      log.error('Error fetching address', {err: err});
      bot.say(to, from + ": Error fetching address.");
    } else {
      bot.say(to, from + ": " + result);
    }
  });
};

/** Look up the tip wallet balance for a nick */
DogeTip.prototype.getbalance = function (bot, to, from, args) {

  var dogeClient = new DogeClient(bot.pluginsConf.dogetip),
    nick;

  if (this._isAdmin(bot, from)) {
    nick = args.shift();
    if (_.isUndefined(nick)) {
      nick = from;
    }
  } else {
    nick = from;
  }

  dogeClient.getbalance(nick, function (err, result) {
    if (err) {
      bot.say(to, from + ": Error fetching balance.");
    } else {
      bot.say(to, from + ": Đ" + result);
    }
  });

};

/** Look up all user accounts */
DogeTip.prototype.ledger = function (bot, to, from, args) {

  var dogeClient = new DogeClient(bot.pluginsConf.dogetip);

  if (this._isAdmin(bot, from)) {
    dogeClient.listaccounts(function (err, result) {

      if (err) {
        bot.say(to, from + ": Such fuck.");
      } else {
        var msgOut = "Balances: ";
        _.each(result, function (value, key) {
          if (key !== '') {
            msgOut += key + ":Đ" + value + " ";
          }
        });
        bot.say(to, msgOut);
      }
    });
  }
};

/** Look up all user accounts */
DogeTip.prototype.stats = function(bot, to, from, args) {

  var dogeClient = new DogeClient(bot.pluginsConf.dogetip),
    nick;

  if (this._isAdmin(bot, from)) {
    nick = args.shift();
    if (_.isUndefined(nick)) {
      nick = from;
    }
  } else {
    nick = from;
  }

  dogeClient.listtransactions(nick, function(err, result) {

    if (err) {
      bot.say(to, from + ": Such fuck.");
    } else {

      /* Tips */
      var msg, tips = 0,
        tipped = 0,
        totalTips = 0.0,
        totalTipped = 0.0,

      /* Send/Recv from addresses */
        sent = 0,
        received = 0,
        totalSent = 0.0,
        totalReceived = 0.0;

      _.each(result, function (tx) {
        if (tx.otheraccount !== nick) {
          if (tx.category == "move") {
            if (tx.amount > 0) {
              tipped += 1;
              totalTipped += tx.amount;
            } else if (tx.amount < 0) {
              tips += 1;
              totalTips += Math.abs(tx.amount);
            }
          } else if (tx.category == "send") {
            sent += 1;
            totalSent += Math.abs(tx.amount);
          } else if (tx.category == "receive") {
            received += 1;
            totalReceived += tx.amount;
          }
        }
      });

      msg = '%s: sent: %s (Đ%.02f) - recv: %s (Đ%.02f) - avg sent: Đ%.02f';
      bot.say(to, sprintf(msg, from, tips, totalTips, tipped, totalTipped, (totalTips / tips)));
    }
  });
};

/** generic info about the chain */
DogeTip.prototype.info = function(bot, to, from, args) {

  var dogeClient = new DogeClient(bot.pluginsConf.dogetip);

  dogeClient.getinfo(function (err, result) {
    if (err) {
      bot.say(to, from + ": Many arses.");
    } else {
      var msgOut = sprintf("latest: %s diff: %s" , result.blocks, result.difficulty);
      bot.say(to, from + ": " + msgOut);
    }
  });
};

/** Tip a nick */
DogeTip.prototype.tip = function (bot, to, from, args) {

  var dogeClient = new DogeClient(bot.pluginsConf.dogetip),
    tipTo, tipAmt;

  tipTo = args[0];
  tipAmt = parseFloat(args[1]);

  if (!this._isValidAmount(tipAmt)) {
    bot.say(to, from + ': Very confuse with tip ' + tipAmt + '?');
    return;
  }

  this._inChannel(bot, tipTo, to, function (err, inChannel) {
    if (!inChannel) {
      bot.say(to, from + ': ' + tipTo + ' must be in the channel');
    } else {
      async.parallel({
        fromAddress: dogeClient.getaddress.bind(dogeClient, from),
        fromBalance: dogeClient.getbalance.bind(dogeClient, from),
        toAddress: dogeClient.getaddress.bind(dogeClient, tipTo)
      }, function (err, results) {
        if (err) {
          log.error('Error fetching addresses', {err: err});
          bot.say(to, sprintf('%s: Error fetching addresses.', from));
          return;
        } else {
          if (tipAmt > results.fromBalance) {
            bot.say(to, sprintf('%s: Insufficient funds', from));
            return;
          }

          dogeClient.move(from, tipTo, tipAmt, function (err, result) {
            if (err) {
              bot.say(to, sprintf('%s: Error tipping doge', from));
            } else {
              bot.say(to, sprintf('%s: Tipped Đ%s to %s', from, tipAmt, tipTo));
            }
          });
        }
      });
    }
  });
};

/** Admin only - move doge between accounts */
DogeTip.prototype.move = function (bot, to, from, args) {

  var dogeClient = new DogeClient(bot.pluginsConf.dogetip),
    moveFrom, moveTo, moveAmt;

  if (!this._isAdmin(bot, from)) {
    bot.say(to, from + ': You are not an admin');
    return;
  }

  moveFrom = args[0];
  moveTo = args[1];
  moveAmt = parseFloat(args[2]);

  if (!this._isValidAmount(moveAmt)) {
    bot.say(to, from + ': Very confuse with amount ' + moveAmt + '?');
    return;
  }

  async.parallel({
    fromAddress: dogeClient.getaddress.bind(dogeClient, from),
    fromBalance: dogeClient.getbalance.bind(dogeClient, from),
    toAddress: dogeClient.getaddress.bind(dogeClient, moveTo)
  }, function (err, results) {
    if (err) {
      log.error('Error fetching addresses', {err: err});
      bot.say(to, sprintf('%s: Error fetching addresses.', from));
    } else {
      if (moveAmt > results.fromBalance) {
        bot.say(to, sprintf('%s: Insufficient funds', from));
        return;
      }

      dogeClient.move(moveFrom, moveTo, moveAmt, function (err, result) {
        if (err) {
          bot.say(to, sprintf('%s: Error moving doge', from));
        } else {
          bot.say(to, sprintf('%s: Moved Đ%s from %s to %s', from, moveAmt, moveFrom, moveTo));
        }
      });
    }
  });
};

/** Send doge to a nick's wallet */
DogeTip.prototype.sendto = function (bot, to, from, args, callback) {

  var dogeClient = new DogeClient(bot.pluginsConf.dogetip),
    sendTo, sendAmt;
  sendTo = args[0];
  sendAmt = parseFloat(args[1]);

  if (!this._isValidAmount(sendAmt)) {
    bot.say(to, from + ': Very confuse with amount ' + sendAmt + '?');
    return;
  }

  async.parallel([
    function (callback) {
      dogeClient.getaddress(from, callback);
    },
    function (callback) {
      dogeClient.getbalance(from, callback);
    }
  ], function (err, results) {
    if (err) {
      log.error('Error fetching addresses', {err: err});
      bot.say(to, sprintf('%s: Error fetching addresses.', from));
    } else {
      if (results[1] - (sendAmt + 1) < 0.0) {
        bot.say(to, sprintf('%s: Insufficient funds (remember: there is a 1 doge tx fee)', from));
        return;
      }

      dogeClient.sendfrom(from, sendTo, sendAmt, function (err, result) {
        if (err) {
          bot.say(to, sprintf('%s: Error sending doge', from));
        } else {
          bot.say(to, sprintf('%s: Sent Đ%s to %s (tx:%s)', from, sendAmt, sendTo, result));
        }
      });
    }
  });
};

/** Gamble with doge */
DogeTip.prototype.dtgamble = function(bot, to, from, msg, callback) {

  var dogeClient = new DogeClient(bot.pluginsConf.dogetip),
      botName = bot.config.nick,
      winning = false,
      amt = 0,
      args = msg.split(" ");

  async.parallel({
      pot: dogeClient.getbalance.bind(dogeClient, botName),
      gBal: dogeClient.getbalance.bind(dogeClient, from)
    }, function (err, result) {
      if (err) {
        log.error('Error getting balances for gamble', {err: err});
        bot.say(to, "Many Dicks...");
        callback();
        return;
      } else {
        var wager = parseFloat(args);

        if (isNaN(wager)) {
          bot.say(to, from + ": Assholes don't wager DOGE");
          callback();
          return;
        }

        if (wager > result.pot)
        {
          bot.say(to, from + ": Assholes bet more than the pot");
          callback();
          return;
        }

        if (wager > result.gBal)
        {
          bot.say(to, from + ": Assholes wager more than they have");
          callback();
          return;
        }

        winning = Math.random() < Math.pow(Math.E, -(wager/result.pot)) / 2;
        amt = wager * (3/4);
        if (winning)
        {
          dogeClient.move(botName, from, amt, function(err2, result2) {
            if (err2) {
              log.error("Error moving DOGE for gamble" , {err: err2});
              bot.say(to, from + ": You won, but transfer failed. SUCH BAD LUCK");
              callback();
              return;
            } else {
              log.info("Gamble Won!", {user: from, amount: amt});
              bot.say(to, from + ": SUCH LUCK!! You win Đ" + amt);
              callback()
              return;
            }
          });
        } else {
          dogeClient.move(from, botName, wager, function(err2, result2) {
            if (err2) {
              log.error("Error moving DOGE for gamble" , {err: err2});
              bot.say(to, from + ": You lost, but transfer failed. SUCH GOOD LUCK");
              callback();
              return;
            } else {
              log.info("Gamble Lost!", {user: from, amount: amt});
              bot.say(to, from + ": MANY FAIL!! You lose Đ" + wager);
              callback();
              return;
            }
          });
        }
      }
    });
};

exports.Plugin = DogeTip;
