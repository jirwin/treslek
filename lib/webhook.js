var http = require("http");
var url = require("url");

var redis = require('redis');


/**
 * WebhookServer
 */
function WebhookServer(config) {
  this.config = config;
}

/**
 * Start the server.
 */
WebhookServer.prototype.start = function() {
  var self = this;

  function onRequest(req, res) {
    var pathname = url.parse(request.url).pathname,
        channel = pathname.slice(1);

    res.writeHead(200, {"Content-Type": "text/plain"});
    res.write(channel);
    res.end();
  }

  http.createServer(onRequest).listen(this.config.webhookPort);
  console.log("Server has started.");
};

exports.WebhookServer = WebhookServer;
