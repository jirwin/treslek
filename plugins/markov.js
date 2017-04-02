var markov = require('markov');


var Markov = function() {
  this.hooks = ['markov'];
};

Markov.prototype.markov = function (bot, to, from, msg, callback) {
  var nicks = bot.users(to);

  var random = Math.floor(Math.random() * nicks.length);

  var nick = nicks[random];

  bot.getLogs(to, 500, nick, function(err, logs) {
    if (err) {
      callback();
      return;
    }

    combinedLogs = logs.reduce(function(seed, val) {
      return seed + " " + val.msg;
    }, "");

    var m = markov(2);

    m.seed(combinedLogs, function() {
      bot.say(to, m.respond(msg).join(' '));
      callback();
      return;
    });
  })
};