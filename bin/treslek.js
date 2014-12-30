#!/usr/bin/env node

var logmagic = require('logmagic');

var treslek = require('../lib/treslek');
var conf = require('../conf.json');

logmagic.registerSink('stdout', function(module, level, message) { console.log(message); });
logmagic.route('__root__', logmagic.INFO, 'stdout');

var bot = new treslek.TreslekBot(conf);

bot.start();
