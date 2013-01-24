var async = require('async');
var request = require('request');
var spotibase = 'http://ws.spotify.com/lookup/1/.json?uri='
/*
 * Spotify Plugin
 *   - creates a hook that fetches information from spotify urls
 *
 */

var Spotify = function() {
  this.hooks = ['spotify'];
};

Spotify.prototype.spotify = function(bot, to, from, msg, callback) {
  var spotifyReg = /spotify:[a-z0-9:]+/gi, 
    matches = msg.match(spotifyReg);
  
  if (!matches) {
      callback();
      return;
  }

  async.forEach(matches, function(url, callback) {
    request(spotibase+url, function(err, res, body) {
      var response, data;
      
      if (err || res.statusCode === 404) {
	console.log('Error pulling from Spotify');
	callback();
	return;
      }

      if (res.statusCode === 200) {
	data = JSON.parse(body);
	if (data['info']['type'] == 'track') {
	    var artistNames = [];
	    data['track']['artists'].forEach(function(art) {
		    artistNames.push(art['name']);
		});
	    response = artistNames.join(', ')
	      +' - '
	      + data['track']['name']
	      + ' ['
	      + data['track']['album']['name']
	      + ' ('
	      + data['track']['album']['released']
	      + ')]';
	}
	else if (data['info']['type'] == 'album') {
	  response = data['album']['artist']
	    + "'s "
	    + data['album']['name']
	    + ' ('
	    + data['album']['released'] + ')';
	}
	else if (data['info']['type'] == 'artist') {
	    response = data['artist']['name'];
	}

	bot.say(to, response);
	callback();
      }
    });
  }, callback);
};

exports.Plugin = Spotify;