#!/usr/bin/env node

var treslek = require('../lib/treslek');
var conf = require('../conf').conf;

var bot = new treslek.TreslekBot(conf);

bot.start();
