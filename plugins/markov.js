var markov = require('markov');

var log = require('logmagic').local('treslek.plugins.markov');

var Markov = function() {
  this.commands = ['markov'];
  this.hooks = ['markovHook'];
};

Markov.prototype.markov = function(bot, to, from, msg, callback) {
  var msgSplit = msg.split(' ');

  impersonateNick = msgSplit[0];

  bot.getLogs(to, 500, impersonateNick, function (err, logs) {
    if (err) {
      bot.say(to, "Couldn't find any history for this person.");
      callback();
      return;
    }

    combinedLogs = logs.reduce(function (seed, val) {
      return seed + " " + val.msg;
    }, "");

    if (combinedLogs.split(' ').length < 20) {
      bot.say(to, "Not enough info. Sorry.");
      return;
    }

    var m = markov(2);

    m.seed(new Buffer(combinedLogs), function () {
      bot.say(to, impersonateNick + " says: " + m.respond(msg, 20).join(' '));
      callback();
      return;
    });
  });
};

Markov.prototype.markovHook = function (bot, to, from, msg, callback) {
  var nicks = bot.users(to);

  var randomChance = Math.floor(Math.Random() * 100);

  if (randomChance === 42) {

    var random = Math.floor(Math.random() * nicks.length);

    var nick = nicks[random];

    bot.getLogs(to, 500, nick, function (err, logs) {
      if (err) {
        callback();
        return;
      }

      combinedLogs = logs.reduce(function (seed, val) {
        return seed + " " + val.msg;
      }, "");

      var m = markov(2);

      m.seed(new Buffer(combinedLogs), function () {
        bot.say(to, nick + " says: " + m.respond(msg, 20).join(' '));
        callback();
        return;
      });
    });
  }

  callback();
};

exports.Plugin = Markov;