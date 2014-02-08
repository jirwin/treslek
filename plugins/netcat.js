var dgram = require('dgram');

var log = require('logmagic').local('treslek.plugins.netcat');


/**
 * Opens a socket and listens for commands via udp.
 *
 * format for udp packet is: from:to:command:text\n
 * e.g. saybot:#treslek:!echo monkey face\n
 * This command will say 'monkey face' to #treslek. This message will be
 * processed just as if the user saybot said it in channel, but won't show
 * in channel of course.
 */
var Netcat = function() {
  this.auto = ['listen'];
  this.port = '3807';
};


Netcat.prototype.listen = function(bot) {
  var that = this,
      socket = dgram.createSocket('udp4');

  socket.on('listening', function() {
    log.info('Listening on port', {port: that.port});
  });

  socket.on('message', function(line) {
    var injectInfo = line.toString().replace('\n', '').split(':'),
        finalBlock = injectInfo[2],
        ii;

    if (injectInfo.length < 3) {
      log.error('Not enough params to inject message', {line: line});
      return;
    }

    // FIXME: I'm on the train without internet, and couldn't remember out how to
    // set a maximum number of splits on String.split(). This forces all splits
    // after the second to be smooshed into the 3rd section.
    for(ii = 3; ii < injectInfo.length; ii++) {
      finalBlock += ':' + injectInfo[ii];
    }
    injectInfo[2] = finalBlock;

    bot.inject(injectInfo[0], injectInfo[1], injectInfo[2], {});
  });

  socket.bind(this.port);
};

exports.Plugin = Netcat;
