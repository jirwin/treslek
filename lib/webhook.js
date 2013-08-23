var http = require("http");
var url = require("url");

var async = require('async');
var redis = require('redis');


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
        channel = [self.config.redis.prefix, pathname.slice(1)].join(':');

    async.parallel([
      self.redis.publish.bind(self.redis, channel, req.body),

      self.redis.sadd.bind(self.redis, channelKey, channel)
    ], function(err) {
      if (err) {
        console.error('OMG ERROR', {err: err});
        res.writeHead(500, {'Content-Type': 'text/plain'});
      } else {
        res.writeHead(200, {"Content-Type": "text/plain"});
      }
      res.end();
    });
  }

  http.createServer(onRequest).listen(self.config.webhook.port, self.config.webhook.host);
  console.log("Server has started.");
};

exports.WebhookServer = WebhookServer;
