exports.conf = {
  nick: 'treslek',
  host: 'irc.freenode.net',
  ircOptions: {
    port: 6667,
    channels: ['##bullpeen'],
    userName: 'treslek',
    realName: 'treslek',
    autoConnect: 'false'
  },
  ignored: ['doslek'],
  redis: {
    host: 'localhost',
    port: '6379',
    prefix: 'treslek'
  },
  admins: ['jirwin'],
  plugins_dir: "/home/jirwin/projects/treslek/plugins/"
}
