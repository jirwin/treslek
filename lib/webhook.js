var http = require("http");
var url = require("url");

var async = require('async');
var redis = require('redis');

var log = require('logmagic').local('treslek.lib.webhook');


/**
 * WebhookServer
 */
function WebhookServer(config) {
  this.config = config;
  this.redis = redis.createClient(this.config.redis.port, this.config.redis.host);
  this.channelKey = [this.config.redis.prefix, this.config.webhook.channelKey].join(':');
}

/**
 * Start the server.
 */
WebhookServer.prototype.start = function() {
  var self = this;

  function onRequest(req, res) {
    var pathname = url.parse(req.url).pathname,
        channel = [self.config.redis.prefix, pathname.slice(1)].join(':'),
        body = "";

    req.on('data', function(data) {
      body += data;
    });

    req.on('end', function() {
      async.parallel([
        self.redis.publish.bind(self.redis, channel, body),

        self.redis.sadd.bind(self.redis, self.channelKey, channel)
      ], function(err) {
        if (err) {
          log.error('Error publishing request', {err: err});
          res.writeHead(500, {'Content-Type': 'text/plain'});
        } else {
          res.writeHead(200, {"Content-Type": "text/plain"});
        }
        res.end();
      });
    });
  }

  http.createServer(onRequest).listen(self.config.webhook.port, self.config.webhook.host);
  log.info('Webhook server has started.');
};

exports.WebhookServer = WebhookServer;
