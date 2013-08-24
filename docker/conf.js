var path = require('path');

exports.conf = {
  nick: 'treslek',
  host: 'localhost',
  ircOptions: {
    port: 6667,
    channels: ['#treslek'],
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
  topics: {
    separator: '::',
    prefixes: {
      '#treslek': 'Treslek'
    }
  },
  admins: ['jirwin', 'morgabra'],
  plugins_dir: path.resolve(__dirname, "plugins")
}
