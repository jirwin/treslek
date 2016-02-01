var async = require('async');
var request = require('request');
var sprintf = require('sprintf').sprintf;

var log = require('logmagic').local('treslek.plugins.spotify');

/*
 * Spotify Plugin
 *   - creates a hook that fetches information from spotify urls
 *
 */
var Spotify = function () {
  this.hooks = ['spotify'];
};

var ENDPOINTS = {
  artist: {
    url: "artists/",
    response: function (data) {
      return data.name;
    }
  },
  album: {
    url: "albums/",
    response: function (data) {
      var arts = data.artists.map(function (bit) {
        return bit.name;
      }).join(", ");
      return sprintf(
        '%s - %s (%s)',
        data.name,
        arts,
        data.release_date
      );
    }
  },
  track: {
    url: "tracks/",
    response: function (data) {
      var arts = data.artists.map(function (bit) {
        return bit.name;
      }).join(", ");
      return sprintf(
        '%s - %s [%s]',
        arts,
        data.name,
        data.album.name
      );
    }
  }
};

/*
 * spotify hook.
 */
Spotify.prototype.spotify = function (bot, to, from, msg, callback) {
  var spotibase = 'https://api.spotify.com/v1/',
    spotifyReg = /spotify:[a-z0-9:]+/gi,
    matches = msg.match(spotifyReg);

  if (!matches) {
    callback();
    return;
  }

  async.forEach(matches, function (match, callback) {

    var bits = match.split(":"),
      type = bits[1],
      id = bits[2],
      hook = ENDPOINTS[type];

    if (hook) {

      request(spotibase + hook.url + id, function (err, res, body) {

        if (err || res.statusCode === 404) {
          log.error('Error pulling from spotify', {err: err, statusCode: res.statusCode});
          callback();
          return;
        }

        if (res.statusCode === 200) {
          var data = JSON.parse(body);
          bot.say(to, hook.response(data));
          callback();
        }
      });
    } else {
      callback();
    }
  }, callback);
};

exports.Plugin = Spotify;
