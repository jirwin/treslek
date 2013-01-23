var redis = require('redis');
var async = require('async');
var sprintf = require('sprintf').sprintf;

/*
 * Karma plugin.
 */
var Karma = function() {
  this.commands = ['score', 'high', 'low'];
  this.hooks = ['karma'];
  this.usage = {
    score: 'ex: !score nick. Returns the amount of karma for a user.',
    high: 'ex: !high 5. Returns the top x users. Defaults to 5.',
    low: 'ex: !low 5. Returns the bottom x users. Defaults to 5.'
  };
};


/*
 * Score command.
 * Reports the amount of karma a user has.
 */
Karma.prototype.score = function(bot, to, from, msg, callback) {
  var nick,
      rc = redis.createClient(bot.redisConf.port, bot.redisConf.host),
      karmaStore = sprintf('%s:karma', bot.redisConf.prefix);

  if (msg === '') {
    bot.say(to, 'Please enter a nick.');
    callback();
    return;
  }

  nick = msg.split(' ')[0];
  rc.zscore(karmaStore, nick, function(err, reply) {
    var points = parseInt(reply),
        plural = Math.abs(points) === 1 ? '!' : 's!';

    if (isNaN(points)) {
      points = 0;
    }

    bot.say(to, nick + ' has ' + points + ' point' + plural);
    rc.quit();
    callback();
  });
};


/*
 * high command.
 * return the top n scores
 */
Karma.prototype.high = function(bot, to, from, msg, callback) {
  var rc = redis.createClient(bot.redisConf.port, bot.redisConf.host),
      karmaStore = sprintf('%s:karma', bot.redisConf.prefix),
      tokens = msg.split(' '),
      count = parseInt(tokens[0]);

  if (isNaN(count)) {
    count = 5;
  }

  rc.zrevrange(karmaStore, 0, count - 1, 'WITHSCORES', function(err, reply) {
    var nick = null;

    bot.say(to, 'Top ' + count + ' scores:');

    reply.forEach(function(score) {
      if (nick === null) {
        nick = score;
      } else {
        bot.say(to, score + ' ' + nick);
        nick = null;
      }
    });

    rc.quit();
    callback();
  });
};


/*
 * low command.
 * return the low n scores
 */
Karma.prototype.low = function(bot, to, from, msg, callback) {
  var rc = redis.createClient(bot.redisConf.port, bot.redisConf.host),
      karmaStore = sprintf('%s:karma', bot.redisConf.prefix),
      tokens = msg.split(' '),
      count = parseInt(tokens[0]);

  if (isNaN(count)) {
    count = 5;
  }

  rc.zrange(karmaStore, 0, count - 1, 'WITHSCORES', function(err, reply) {
    var nick = null;

    bot.say(to, 'Lowest ' + count + ' scores:');

    reply.forEach(function(score) {
      if (nick === null) {
        nick = score;
      } else {
        bot.say(to, score + ' ' + nick);
        nick = null;
      }
    });

    rc.quit();
    callback();
  });
  callback();
};


/*
 * Karma hook.
 * Keeps track of a score for users.
 */
Karma.prototype.karma = function(bot, to, from, msg, callback) {
  var plus = /\+\+$/i,
      minus = /--$/i,
      cmd = /^!/i,
      rc = redis.createClient(bot.redisConf.port, bot.redisConf.host),
      karmaStore = bot.redisConf.prefix + ':karma',
      tokens = msg.split(' ');

  if (cmd.test(msg)) {
    callback();
    return;
  }

  async.forEach(tokens, function (token) {
    var nick = token.substr(0, token.length - 2);

    if (plus.test(token)) {
      rc.zincrby(karmaStore, 1, nick);
    } else if (minus.test(token)) {
      rc.zincrby(karmaStore, -1, nick);
    }
  }, function() {
    rc.quit();
    callback();
  });
};


exports.Plugin = Karma;
