var path = require('path');

exports.conf = {
  nick: 'treslek',
  host: 'irc.freenode.net',
  ircOptions: {
    port: 6667,
    channels: ['##testchannel2233'],
    userName: 'treselekbot',
    realName: 'treslekbot',
    autoConnect: false,
    floodProtection: true,
    floodProtectionDelay: 100
  },
  ignored: ['doslek'],
  redis: {
    host: '127.0.0.1',
    port: '6379',
    prefix: 'treslek'
  },
  admins: ['morgabra'],
  plugins_dir: path.resolve(__dirname, "plugins")
}
