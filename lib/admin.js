/*
 * Admin plugin.
 *    - join, part: Join and part channels
 *    - load, reload, unload: Control plugins.
 *    - ignore, unignore: Stop listening for input from
 *                        a specific nick.
 */ 
var Admin = function() {
  this.commands = [
      'join', 'part',
      'load', 'reload', 'unload',
      'ignore', 'unignore'
  ];
};


/*
 * Join command.
 */
Admin.prototype.join = function(bot, to, from, msg, callback) {
  if (msg === '') {
    bot.say(to, 'Please specify a channel to join.');
    callback();
    return;
  }

  bot.join(msg, function(nick, msg) {
    callback()
  });
};


/*
 * Part command.
 */
Admin.prototype.part = function(bot, to, from, msg, callback) {
  if (msg === '') {
    bot.say(to, 'Please specify a channel to part.');
    callback();
    return;
  }

  bot.part(msg, function(nick, msg) {
    callback()
  });
};


/*
 * Load command.
 */
Admin.prototype.load = function(bot, to, from, msg, callback) {
  if (msg === '') {
    bot.say(to, 'Please specify a plugin to load.');
    callback();
    return;
  }

  bot.load(msg, function(err) {
    if (err) {
      console.log(err);
      bot.say(to, err);
      callback();
      return;
    }
    bot.say(to, 'Successfully loaded ' + msg);
    callback();
  });
};


/*
 * Reload command.
 */
Admin.prototype.reload = function(bot, to, from, msg, callback) {
  if (msg === '') {
    bot.say(to, 'Please specify a plugin to reload.');
    callback();
    return;
  }

  bot.reload(msg, function(err) {
    if (err) {
      console.log(err);
      bot.say(to, err);
      callback();
      return;
    }
    bot.say(to, 'Successfully reloaded ' + msg);
    callback();
  });
};


/*
 * Unload command.
 */
Admin.prototype.unload = function(bot, to, from, msg, callback) {
  if (msg === '') {
    bot.say(to, 'Please specify a plugin to unload.');
    callback();
    return;
  }

  bot.unload(msg, function(err) {
    if (err) {
      console.log(err);
      bot.say(to, err);
      callback();
      return;
    }
    bot.say(to, 'Successfully unloaded ' + msg);
    callback();
  });
};


/*
 * Ignore command.
 */
Admin.prototype.ignore = function(bot, to, from, msg, callback) {
  console.log('admin ignore command');
  callback();
};


/*
 * Unignore command.
 */
Admin.prototype.unignore = function(bot, to, from, msg, callback) {
  console.log('admin unignore command');
  callback();
};


exports.Plugin = Admin;
