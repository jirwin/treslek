#!/usr/bin/env node

var WebhookServer = require('../lib/webhook').WebhookServer;
var conf = require('../conf').conf;

var server = new WebhookServer(conf);

server.start();
