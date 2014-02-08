var cp = require('child_process');
/*
 * Sys plugin.
 */
var Sys = function() {
  this.commands = [
    'date', 'ping', 'ping6', 'figlet', 'uptime'
  ];
  this.usage = {
    date: 'ex: !date. Outputs the date.',
    ping: 'ex: !ping host. Pings a host.',
    ping6: 'ex: !ping6 host. Pings an IPV6 host.',
    uptime: 'ex: !uptime. Outputs the uptime.',
    figlet: 'ex: !figlet text. Generates a figlet of text.'
  };
};


/*
 * date command.
 */
Sys.prototype.date = function(bot, to, from, msg, callback) {
  var date = cp.spawn('date');

  date.stdout.on('data', function(data) {
    bot.say(to, data);
  });

  date.on('exit', function(code) {
    callback();
  });
};


/*
 * ping command.
 */
Sys.prototype.ping = function(bot, to, from, msg, callback) {
  var ping = cp.spawn('ping', ['-c', '1', msg.split(' ')[0]]);

  ping.stdout.on('data', function(data) {
    bot.say(to, data);
  });

  ping.on('exit', function(code) {
    callback();
  });
};


/*
 * ping6 command.
 */
Sys.prototype.ping6 = function(bot, to, from, msg, callback) {
  var ping = cp.spawn('ping6', ['-c', '1', msg.split(' ')[0]]);

  ping.stdout.on('data', function(data) {
    bot.say(to, data);
  });

  ping.on('exit', function(code) {
    callback();
  });
};


/*
 * uptime command.
 */
Sys.prototype.uptime = function(bot, to, from, msg, callback) {
  var uptime = cp.spawn('uptime');

  uptime.stdout.on('data', function(data) {
    bot.say(to, data);
  });

  uptime.on('exit', function(code) {
    callback();
  });
};


/*
 * figlet command.
 */
Sys.prototype.figlet = function(bot, to, from, msg, callback) {
  var fig = cp.spawn('figlet', ['-f', 'ascii12', '-w', '62', msg]);

  fig.stdout.on('data', function(data) {
    bot.say(to, data);
  });

  fig.on('exit', function(code) {
    callback();
  });
};


exports.Plugin = Sys;
