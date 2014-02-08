var async = require('async');
var request = require('request');
var cheerio = require('cheerio');
var Bitly = require('bitly');

/*
 * URL plugin
 *   - creates a hook that checks for urls. It then grabs the title
 *     and outputs that to the channel.
 */
var Url = function() {
  this.hooks = ['url'];

  // Enable bitly shortification by adding credentials here
  this.bitly = {
    user: '',
    apiKey: '',
  };
};


/*
 * Helper function for shortening a url with bitly.
 */
var shortenUrl = function(bitly, url, callback) {
  if (!bitly) {
    callback(null, url);
    return;
  }

  bitly.shorten(url, function(err, resp) {
    if (err) {
      console.log('Error shortening url', {err: err, url: url});
      callback(err);
      return;
    }

    callback(null, resp.data.url || url);
  });
};


/*
 * URL hook.
 *   Searchs a message for any urls, and then request each url.
 *   If the url returns a content-type of 'text/html', attempt
 *   to get the page title. If not, return the content type. If
 *   bitly is configured, shorten urls as well.
 */
Url.prototype.url = function(bot, to, from, msg, callback) {
  var urlReg = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/gi,
      matches = msg.match(urlReg),
      bitly;

  if (!matches) {
    callback();
    return;
  }

  if (this.bitly && this.bitly.user !== '' && this.bitly.apiKey !== '') {
    bitly = new Bitly(this.bitly.user, this.bitly.apiKey);
  }

  async.forEach(matches, function(url, callback) {
    request(url, function(err, res, body) {
      var response,
          parsed,
          title,
          contentType;

      if (err || res.statusCode === 404) {
        console.log('Error retrieving ' + url);
        callback();
        return;
      }

      if (res.statusCode === 200) {
        contentType = res.headers['content-type'].split(';')[0];
        if (contentType !== 'text/html') {
          title = contentType;
        } else {
          parsed = cheerio.load(body);
          title = parsed('title').text();
        }
      }

      title = title || contentType;

      shortenUrl(bitly, url, function(err, shortUrl) {
        response = title + ' | ' + shortUrl;
        bot.say(to, response);
        callback();
      });

    });
  }, callback);
};


exports.Plugin = Url;
