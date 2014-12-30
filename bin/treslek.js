#!/usr/bin/env node

var logmagic = require('logmagic');
var argv = require('minimist')(process.argv.slice(2));

var treslek = require('../lib/treslek');
var conf = require(argv._[0] || '../conf.json');

logmagic.registerSink('stdout', function(module, level, message) { console.log(message); });
logmagic.route('__root__', logmagic.INFO, 'stdout');

var bot = new treslek.TreslekBot(conf);

bot.start();
