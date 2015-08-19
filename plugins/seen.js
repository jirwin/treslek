var async = require('async');
var sprintf = require('sprintf').sprintf;
var moment = require('moment');

var log = require('logmagic').local('treslek.plugins.seen');


/*
 * Seen command
 *  - seen: Reports what the user was last seen saying
 */
var Seen = function() {
  this.commands = ['seen'];
  this.usage = {
    seen: '!seen <user> - Displays the last thing the user was seen saying.'
  };
};



Seen.prototype.seen = function(bot, to, from, msg, callback) {
  var user = msg;

  if (!user) {
    bot.say(to, 'Please include a user name.');
    callback();
    return;
  }

  async.auto({
    'getLogs': [function(callback) {
      bot.getLogs(to, 1, user, function(err, logs) {
        callback(null, logs);
      });
    }],

    'matchLog': ['getLogs', function(callback, results) {
      var log,
          logs = results.getLogs;

      if (logs.length === 0) {
        bot.say(to, sprintf("%s has not been seen before.", user));
        callback('No matches found');
        return;
      }

      log = logs[0];
      bot.say(to, sprintf('%s was seen saying "%s" %s', user, log.msg, moment(parseInt(log.time, 10)).fromNow()));
      callback();
    }]
  }, callback);
};

exports.Plugin = Seen;
