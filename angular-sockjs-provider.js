angular
    .module('sockjs', [])
    .provider('sockjs', sockjsProvider);

function sockjsProvider() {
    var provider = this;

    var closed = false;

    this.config = {};

    this.$get = ['$rootScope', '$q', '$log', '$interval', sockjsService];

    function sockjsService($rootScope, $q, $log) {

        var ws = {};

        ws._buffer = [];

        ws.connect = function (config) {
            config = config || {};

            var defer = $q.defer();

            if (config.endpoint) provider.config.endpoint = config.endpoint;

            ws.baseSocket = new SockJS(provider.config.endpoint);

            ws.baseSocket.onopen = function(){
                $log.info('Connected!');

                if (ws.queue && ws.queue.length) {
                    ws.queue.forEach(function(item) {
                        send(item);
                    });
                }

                ws.queue = [];

                defer.resolve(ws);
            };

            ws.baseSocket.onmessage = function(message) {

                var parsed = parse_message(message);

                process_message(parsed.event, parsed.message);

                $rootScope.$apply();
            };

            ws.baseSocket.onclose = function() {
                $log.info('Disconnected!');

                ws.baseSocket = null;

                if(!closed) setTimeout(function(){ws.connect()}, 2000);
            };

            ws.baseSocket.onerror = function(error) {

                $log.error(error);

                defer.reject(error);
            };

            return defer.promise;
        };

        var make_message = function (event, message) {
            return JSON.stringify({event: event, message: message});
        };

        var parse_message = function (msg) {
            var json = JSON.parse(msg.data);
            return {event: json.event, message: json.message};
        };

        var process_message = function (event, message) {
            if(ws.listeners && ws.listeners[event]){
                ws.listeners[event].forEach(function(callback){
                    callback(message);
                })
            }
        };

        var send = function (msg) {
            if(!ws.queue) ws.queue = [];
            if (!ws.baseSocket || ws.baseSocket.readyState !== 1) return ws.queue.push(msg);
            ws.baseSocket.send(msg);
        };

        ws.on = function (event, callback) {
            if (!ws.baseSocket) ws.connect();
            if (!ws.listeners) ws.listeners = {};
            if (!ws.listeners[event]) ws.listeners[event] = [];
            if (ws.listeners[event].indexOf(callback) == -1) ws.listeners[event].push(callback);
        };

        ws.emit = function(event, message) {
            if (!ws.baseSocket) ws.connect();
            var msg = make_message(event, message);
            send(msg);
        };

        ws.close = function () {

            if (!ws.baseSocket) return;

            closed = true;

            if(closed) ws.baseSocket.close.apply(ws.baseSocket, arguments);
        };

        return ws;
    }

    this.setEndpoint = function setOptions(endpoint) {
        this.config.endpoint = endpoint;
        return this;
    };
}