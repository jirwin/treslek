#!/usr/bin/env node

var logmagic = require('logmagic');
var logstashSink = require('logmagic-logstash').LogstashSink;


var treslek = require('../lib/treslek');
var conf = require('../conf').conf;

var logstash = new logstashSink('bubba', '162.209.99.44', 9999);

if (conf.hasOwnProperty('logstash') && conf.logstash.host && conf.logstash.port) {
  logmagic.registerSink('logstash', logstash.log.bind(logstash));
  logmagic.route('__root__', logmagic.INFO, 'logstash');
} else {
  logmagic.registerSink('stdout', function(module, level, message) { console.log(message); });
  logmagic.route('__root__', logmagic.INFO, 'stdout');
}

var bot = new treslek.TreslekBot(conf);

bot.start();
