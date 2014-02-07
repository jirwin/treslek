var path = require('path');

exports.conf = {
  nick: 'dogetipbot-test',
  host: 'irc.freenode.net',
  ircOptions: {
    port: 6667,
    channels: ['##dogetipbot-test'],
    userName: 'dogetipbot-test',
    realName: 'dogetipbot-test',
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
      '##dogetipbot-test': 'dogetipbot-test'
    }
  },
  webhook: {
    host: '0.0.0.0',
    port: '1304',
    channelKey: 'webhookChannels'
  },
  github: {
    channels: {
      treslek: '##dogetipbot-test'
    }
  },
  admins: ['jirwin', 'morgabra'],
  plugins_dir: path.resolve(__dirname, "plugins"),
  plugins_conf: {
    dogetip: {
      url: 'http://doge:22555/',
      rpcuser: 'dogecoinrpc',
      rpcpassword: '679npvT5w8MiGs9T178sj2y23Cro4DLixQH3L9UtM5Un',
      admins: ['morgabra']
    }
  }
};