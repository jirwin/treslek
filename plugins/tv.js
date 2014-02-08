var request = require('request');
var sprintf = require('sprintf').sprintf;
var moment = require('moment');

/*
 * TV Plugin
 *   - nextep: Queries TV Rage for info about the next episode for a show
 */
var TV = function() {
  this.commands = ['nextep'];
  this.usage = {
    nextep: 'ex: !nextep <show name>. Gets the next episode info for <show name>.'
  };
};

/**
 * @param {String} dateString Date string from the API.
 * @return {String} Returns a nicely formated date.
 */
function parseDate(dateString) {
  var now = moment(new Date()),
      date = moment(dateString, 'MMM/DD/YYYY'),
      days = Math.ceil(date.diff(now, 'days', true)),
      standard = date.format('M-D-YYYY');

  if (days === 0) {
    return sprintf('Today! (%s)', standard);
  } else if (days === 1) {
    return sprintf('Tomorrow! (%s)', standard);
  } else if (days === -1) {
    return sprintf('Yesterday! (%s)', standard);
  } else if (days < -1 && days >= -7) {
    return sprintf('Last %s (%s)', date.format('dddd'), standard);
  } else if (days <= 7 && days > 0) {
    return sprintf('Next %s (%s)', date.format('dddd'), standard);
  }

  return standard;
}


/*
 * Nextep command.
 */
TV.prototype.nextep = function(bot, to, from, msg, callback) {
  var intervalId, url;

  url = sprintf('http://services.tvrage.com/tools/quickinfo.php?show=%s', encodeURIComponent(msg));

  request(url, function(err, res, body) {
    var epInfo = {},
        outMsg = '',
        epDetails;

    clearInterval(intervalId);

    if (!body) {
      bot.say(to, 'Unable to retrieve episode information for ' + msg);
      callback();
      return;
    }

    body.split('\n').forEach(function(line) {
      line = line.split('@');
      epInfo[line[0]] = line[1];
    });

    if (Object.keys(epInfo).length === 0 || !epInfo.hasOwnProperty('Latest Episode')) {
      bot.say(to, 'Unable to retrieve episode information for ' + msg);
      callback();
      return;
    }

    if (epInfo.Status === 'Returning Series') {
      if (epInfo.hasOwnProperty('Next Episode')) {
        epDetails = epInfo['Next Episode'].split('^');
        outMsg = sprintf("%s's next episode '%s - %s' airs %s.",
                         epInfo['Show Name'],
                         epDetails[0],
                         epDetails[1],
                         parseDate(epDetails[2]));
      } else {
        epDetails = epInfo['Latest Episode'].split('^');
        outMsg = sprintf("%s hasn't scheduled the next episode yet. The last episode '%s - %s' aired %s.",
                         epInfo['Show Name'],
                         epDetails[0],
                         epDetails[1],
                         parseDate(epDetails[2]));
      }
    } else {
      epDetails = epInfo['Latest Episode'].split('^');
      outMsg = sprintf("%s isn't on any more. The last episode '%s - %s' aired %s.",
                       epInfo['Show Name'],
                       epDetails[0],
                       epDetails[1],
                       parseDate(epDetails[2]));
    }

    bot.say(to, outMsg);
    callback();
  });
};


exports.Plugin = TV;
