var redis = require('redis');
var async = require('async');
var sprintf = require('sprintf').sprintf;

/*
 * Vote plugin.
 */
var Vote = function() {
  this.commands = ['vote', 'newvote'];
  this.usage = {
    vote: 'Use with no arguments to show the current vote. Pass an argument to vote.',
    newvote: 'ex: !newvote Favorite Color. Creates a new vote.'
  }
};


/*
 * vote command.
 */
Vote.prototype.vote = function(bot, to, from, msg, callback) {
  var rc = redis.createClient(bot.redisConf.port, bot.redisConf.host),
      voteId;

  async.auto({
    voteId: function(callback) {
      rc.get(bot.redisConf.prefix + ':vote:id', function(err, reply) {
        callback(err, reply);
      });
    },

    voteStore: ['voteId', function(callback, results) {
      callback(null, sprintf('%s:%s:vote', bot.redisConf.prefix, results.voteId));
    }],

    voteTopic: ['voteStore', function(callback, results) {
      rc.get(results.voteStore + ':topic', function(err, reply) {
        callback(err, reply);
      });
    }],

    hasVote: ['voteStore', function(callback, results) {
      rc.sismember(results.voteStore + ':voters', from, function(err, reply) {
        if (reply === '0') {
          callback(err, false);
        } else {
          callback(err, true);
        }
      });
    }],

    vote: ['voteStore', 'hasVote', function(callback, results) {
      rc.get(results.voteStore + ':voter:' + from, function(err, reply) {
        var vote = false;

        if (results.hasVote && reply !== 'null') {
          console.log('got reply');
          vote = reply;
        }
        callback(err, vote);
      });
    }],

    registerVote: ['voteStore', 'voteTopic', 'vote', function(callback, results) {
      if (msg === '') {
        bot.say(to, 'Vote: ' + results.voteTopic);
        rc.zrevrange(results.voteStore, 0, -1, 'WITHSCORES', function(err, reply) {
          var choice = null;

          reply.forEach(function(score) {
            if (choice === null) {
              choice = score;
            } else{
              if (score > 0) {
                bot.say(to, sprintf('%7d: %s', parseInt(score), choice));
              }
              choice = null;
            }
          });

          callback();
        });
      } else {
        if (results.vote) {
          bot.say(to, sprintf('Vote changed from %s to %s.', results.vote, msg));
          rc.zincrby(results.voteStore, -1, results.vote);
        } else {
          bot.say(to, 'Vote registered.');
          rc.sadd(results.voteStore + ':voters', from);
        }

        rc.set(results.voteStore + ':voter:' + from, msg);
        rc.zincrby(results.voteStore, 1, msg);
        callback();
      }
    }]
  },

  function(err) {
    if (err) {
      bot.say(to, 'Error registering vote.');
      callback();
      return;
    }

    rc.quit();
    callback()
  });
};


/*
 * newvote command.
 */
Vote.prototype.newvote = function(bot, to, from, msg, callback) {
  var rc = redis.createClient(bot.redisConf.port, bot.redisConf.host);

  if (msg === '') {
    bot.say(to, 'Please enter what you are voting about.');
    callback();
    return;
  }

  async.waterfall([
    function (callback) {
      rc.incr(bot.redisConf.prefix + ':vote:id', function(err, reply) {
        callback(err, reply);
      });
    },

    function (voteId, callback) {
      rc.set(bot.redisConf.prefix + ':' + voteId + ':vote:topic', msg, function(err, reply) {
        bot.say(to, 'Vote created.');
        callback();
      });
    }
  ],
  function(err) {
    if (err) {
      bot.say(to, 'Error creating vote.');
      callback();
      return;
    }

    rc.quit();
    callback();
  });
};


exports.Plugin = Vote;
