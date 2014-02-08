var async = require('async');
var request = require('request');
var sprintf = require('sprintf').sprintf;

var log = require('logmagic').local('treslek.plugins.spotify');

/*
 * Spotify Plugin
 *   - creates a hook that fetches information from spotify urls
 *
 */
var Spotify = function() {
  this.hooks = ['spotify'];
};

/*
 * spotify hook.
 */
Spotify.prototype.spotify = function(bot, to, from, msg, callback) {
  var spotibase = 'http://ws.spotify.com/lookup/1/.json?uri=',
      spotifyReg = /spotify:[a-z0-9:]+/gi,
      matches = msg.match(spotifyReg);

  if (!matches) {
    callback();
    return;
  }

  async.forEach(matches, function(url, callback) {
    request(spotibase + url, function(err, res, body) {
      var response, data;

      if (err || res.statusCode === 404) {
        log.error('Error pulling from spotify', {err: err, statusCode: res.statusCode});
        callback();
        return;
      }

      if (res.statusCode === 200) {
        data = JSON.parse(body);

        if (data.info.type === 'track') {
          var artistNames = [];
          data.track.artists.forEach(function(art) {
            artistNames.push(art.name);
          });
          response = sprintf(
            '%s - %s [%s (%s)]',
            artistNames.join(', '),
            data.track.name,
            data.track.album.name,
            data.track.album.released
          );
        } else if (data.info.type === 'album') {
          response = sprintf(
            "%s's %s (%s)",
            data.album.artist,
            data.album.name,
            data.album.released
          );
        } else if (data.info.type === 'artist') {
          response = data.artist.name;
        }

        bot.say(to, response);
        callback();
      }
    });
  }, callback);
};


exports.Plugin = Spotify;
