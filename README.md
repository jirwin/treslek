<a href="https://travis-ci.org/jirwin/treslek"><img src="https://travis-ci.org/jirwin/treslek.png" /></a>
# treslek

[![Join the chat at https://gitter.im/jirwin/treslek](https://badges.gitter.im/jirwin/treslek.svg)](https://gitter.im/jirwin/treslek?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
A node irc bot made to replace doslek.

## Webhook Server
treslek supports running a simple HTTP server for receiving webhooks
from external services and acting on them. In order to enable this
feature, include a key in the config that looks something like the
following:
```json
"webhook": {
  "host": "0.0.0.0",
  "port": 1304,
  "channelKey": "webhookChannels"
}
```

The webhook server works by forwarding the headers and body of any
incoming request to a PUBSUB channel on the Redis server. This allows
any plugins to listen for any requests that may come in and deal with
them accordingly. Given the above configuration, a redis prefix of
`treslek` and the assumption that treslek is available at
`http://treslek.example.com:1304`, a HTTP request to `http://treslek.example.com:1304/treslek/webhook`
would be published to the Redis key `treslek:webhookChannels:treslek/webhook`.
A plugin that would like to listen to this webhook would then subscribe
to `treslek:webhookChannels:treslek/webhook` and react as it pleases.

A good example of this would be a plugin that listens for webhooks from
Github about activity on a set of repositories. You could configure each
of your repositories to send webhooks to
`http://treslek.example.com:1304/github/<repo-name>` and then write a
plugin to announce when Pull Requests have been opened.


## License
treslek may be freely distributed under the MIT license.
