var treslek = require('../lib/treslek');
var conf = require('../conf').conf;

var bot = new treslek.Treslek(conf);

bot.start();
