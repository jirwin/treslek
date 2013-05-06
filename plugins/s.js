var async = require('async');
var sprintf = require('sprintf').sprintf;


/*
 * Substitute command
 *  - s: Use a regex to replace text
 */
var Substitute = function() {
  this.hooks = ['s'];
  this.usage = {
    s: 'Does fancy things'
  };
};


function parseCommand(bot, to, text, callback) {
  var match, replacement, options, cmd;

  if (text.indexOf('!s') !== 0) {
    callback(null, false);
    return;
  }

  cmd = text.split('/');

  if (cmd.length !== 4) {
    console.log('Invalid s syntax.', text);
    bot.say(to, 'Invalid syntax.');
    callback(null, false);
    return;
  }

  callback(null, {match: cmd[1], replacement: cmd[2], options: cmd[3]});
}


Substitute.prototype.s = function(bot, to, from, msg, callback) {
  async.auto({
    'cmd': function(callback) {
      parseCommand(bot, to, msg, callback);
    },

    'processCmd': ['cmd', function(callback, results) {
      var cmd = results.cmd;

      if (!cmd) {
        callback("This doesn't appear to be a s command");
        return;
      }

      callback(null, cmd);
    }],

    'getLogs': ['processCmd', function(callback, results) {
      var cmd = results.processCmd,
          user = from;

      if (cmd.options && cmd.options.indexOf('g') !== -1) {
        user = null;
      }

      bot.getLogs(to, 50, user, function(err, logs) {
        callback(null, logs);
      });
    }],

    'matchLog': ['getLogs', function(callback, results) {
      var cmd = results.processCmd,
          caseSensitive = true,
          matchedLog,
          logs = results.getLogs;

      if (logs.length === 0) {
        bot.say(to, sprintf("No match for %s found.", cmd.match));
        callback('No matches found');
        return;
      }

      if (cmd.options && cmd.options.indexOf('i') !== -1) {
        caseSensitive = false;
      }

      match = new RegExp(cmd.match, caseSensitive ? '' : 'i');

      for (var i = 0; i < logs.length - 1; i++) {
        if (logs[i].from === bot.config.nick) {
          continue;
        }
        if (logs[i].msg.match(/^!s/)) {
          continue;
        }

        if (logs[i].msg.match(match)) {
          matchedLog = logs[i];
          break;
        }
      };

      if (!matchedLog) {
        bot.say(to, sprintf('No match found for %s.', cmd.match));
        callback('No match found');
        return;
      }

      callback(null, {log: matchedLog, regex: match});
    }],

    'replaceLog': ['matchLog', function(callback, results) {
      var match = results.matchLog.log,
          cmd = results.processCmd,
          replace = results.matchLog.regex,
          msg = sprintf("%s meant to say:", match.from),
          newMsg;

      msg = sprintf("%s meant to say:", match.from);

      newMsg = match.msg.replace(replace, cmd.replacement);

      bot.say(to, sprintf("%s %s", msg, newMsg));
      callback();
    }]
  }, callback);
};

exports.Plugin = Substitute;
