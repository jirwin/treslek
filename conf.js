var path = require('path');

exports.conf = {
  nick: 'treslekbot',
  host: 'irc.freenode.net',
  ircOptions: {
    port: 6667,
    channels: ['##treslek'],
    userName: 'treslekbot',
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
      '##treslek': 'Treslek'
    }
  },
  webhook: {
    host: '0.0.0.0',
    port: '13041',
    channelKey: 'webhookChannels'
  },
  github: {
    channels: {
      treslek: '##treslek'
    }
  },
  admins: ['jirwin', 'morgabra'],
  plugins_dir: path.resolve(__dirname, "plugins")
}
