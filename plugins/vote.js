var redis = require('redis');
var async = require('async');
var sprintf = require('sprintf').sprintf;

/*
 * Vote plugin.
 */
var Vote = function() {
  this.commands = ['vote', 'newvote'];
  this.usage = {
    vote: '',
    newvote: ''
  }
};


/*
 * vote command.
 */
Vote.prototype.vote = function(bot, to, from, msg, callback) {
  var rc = redis.createClient(bot.redisConf.port, bot.redisConf.host),
      voteId;

  async.waterfall([
    function(callback) {
      rc.get(bot.redisConf.prefix + ':vote:id', function(err, reply) {
        callback(err, reply);
      });
    },

    function(voteId, callback) {
      var voteStore = sprintf('%s:%s:vote', bot.redisConf.prefix, voteId);
      callback(null, voteStore);
    },

    function(voteStore, callback) {
      rc.get(voteStore + ':topic', function(err, reply) {
        callback(err, voteStore, reply);
      });
    },

    function(voteStore, voteTopic, callback) {
      rc.sismember(voteStore + ':voters', from, function(err, reply) {
        if (reply === '0') {
          callback(err, voteStore, voteTopic, false);
        } else {
          callback(err, voteStore, voteTopic, true);
        }
      });
    },

    function(voteStore, voteTopic, voter, callback) {
      rc.get(voteStore + ':voter:' + from, function(err, reply) {
        var vote = false;

        if (voter && reply !== 'null') {
          console.log('got reply');
          vote = reply;
        }
        console.log('vote: ' + vote);
        callback(err, voteStore, voteTopic, vote);
      });
    },

    function(voteStore, voteTopic, vote, callback) {
      if (msg === '') {
        bot.say(to, 'Vote: ' + voteTopic);
        rc.zrevrange(voteStore, 0, -1, 'WITHSCORES', function(err, reply) {
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
        if (vote) {
          bot.say(to, sprintf('Vote changed from %s to %s.', vote, msg));
          rc.zincrby(voteStore, -1, vote);
        } else {
          bot.say(to, 'Vote registered.');
          rc.sadd(voteStore + ':voters', from);
        }

        rc.set(voteStore + ':voter:' + from, msg);
        rc.zincrby(voteStore, 1, msg);
        callback();
      }
    }
  ],

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
