var async = require('async');
var wowhead = require('wowhead')();
var sprintf = require('sprintf').sprintf;
var c = require('irc-colors');

var Wowhead = function() {
  this.hooks = ['hearthstone'];
};

var itemRegEx = /\[([\w\s]+)\]/g;

function coloredNameForQuality(name, quality) {
  var color = function(name) {
    return name;
  };

  switch (quality) {
    case 5:
      color = c.yellow
      break;
    case 4:
      color = c.purple;
      break;
    case 3:
      color = c.navy;
      break;
    case 2:
      color = c.white;
      break;
  }

  return color(name);
};

Wowhead.prototype.hearthstone = function(bot, to, from, msg, callback) {
  var cards = msg.match(itemRegEx);

  if (!cards) {
    callback();
    return;
  }

  function generateOutput(card) {
    var msg = '';

    msg = sprintf('%s %s', coloredNameForQuality('[' + card.name + ']', card.quality), c.cyan(card.cost));

    if (card.attack && card.health) {
      msg += sprintf('/%s/%s', c.green(card.attack), c.red(card.health));
    }

    msg += sprintf(' - %s - %s', card.description, card.getLink());

    return msg;
  };

  async.map(cards, function(card, callback) {
    wowhead.getCard(card.slice(1, card.length - 1), callback);
  }, function(err, results) {
    if (results) {
      results.forEach(function(card) {
        if (card) {
          bot.say(to, generateOutput(card));
        }
      });
    }

    callback();
  });
};

exports.Plugin = Wowhead;
