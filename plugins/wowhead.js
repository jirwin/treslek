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

  if (quality === 'free') {
    color = c.gray.bold
  } else {
    switch (quality) {
      case 5:
        color = c.yellow.bold
        break;
      case 4:
        color = c.purple.bold;
        break;
      case 3:
        color = c.blue.bold;
        break;
      case 2:
        color = c.white.bold;
        break;
      default:
        color = c.gray.bold;
        break;
    }
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

    msg = sprintf('%s (%s)', coloredNameForQuality('[' + card.name + ']', card.quality), c.cyan(card.cost));

    if (card.attack && card.health) {
      msg += sprintf(' %s/%s', c.bold.green(card.attack), c.bold.red(card.health));
    }

    if (card.description) {
      msg += sprintf(' - %s', card.description);
    }

    msg += sprintf(' - %s', card.getLink());

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
