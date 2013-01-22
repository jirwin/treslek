exports.conf = {
  nick: 'treslek',
  host: 'earl.mirwin.net',
  ircOptions: {
    port: 5667,
    channels: ['#treslek'],
    userName: 'treslek',
    realName: 'treslek',
    autoConnect: 'false'
  },
  redis: {
    host: 'localhost',
    port: '6379',
    prefix: 'treslek'
  },
  admins: ['jirwin'],
  plugins_dir: "/home/jirwin/projects/treslek/plugins/"
}
