# angular-sockjs-provider

SockJS provider for Angular.js

## Install

```
bower install angular-sockjs-provider
```

## Usage

```js
angular.module('example', ['sockjs'])
.config(function (sockjsProvider) {
  sockjsProvider.setEndpoint('http://localhost:8888/example');
})
.controller('ExampleCtrl', function ($scope, sockjs, $log) {
  sockjs.emit('some_event', 'some_message');

  sockjs.on('some_event', function(message) {
    $log.info(message);
  });

});
```

## Backend ([sockjs-tornado](https://github.com/mrjoes/sockjs-tornado))

```python
import json
from tornado import web, ioloop
from sockjs.tornado import SockJSRouter, SockJSConnection


class ExampleConnection(SockJSConnection):

    def on_open(self, info):
        print "Connected!"

    def on_message(self, message):
        msg = json.loads(message)
        self.send(json.dumps(dict(event=msg.get('event'), message='received %s' % msg.get('message'))))

    def on_close(self):
        print 'Disconnected!'


if __name__ == '__main__':
    router = SockJSRouter(ExampleConnection, '/example')

    app = web.Application(router.urls)

    app.listen(8888)
    ioloop.IOLoop.instance().start()
```

## License

MIT
