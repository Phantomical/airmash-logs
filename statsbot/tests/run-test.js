"use strict";

const AirmashClient = require('./../client');
const CLIENTPACKET = require('./../gamecode').clientPacket;

class FakeWebsocket {
    constructor() {
        this.onmsg = function () { };
        this.onclose = function () { };
        this.onopen = function () { };
    }

    on(type, fn) {
        if (type === "message") {
            this.onmsg = fn;
        }
        else if (type === "close") {
            this.onclose = fn;
        }
        else if (type === "open") {
            this.onopen = fn;
        }
    }

    send(packet) {
        if (packet.c === CLIENTPACKET.CHAT) {
            console.log(packet.text);
        }

    }

    runtest() {
        this.onopen();

        var lineReader = require('readline').createInterface({
            input: require('fs').createReadStream('test-log')
        });

        lineReader.on('line', function (line) {
            let packet = JSON.parse(line.trim());

            this.onmsg(packet);
        }.bind(this));

        setTimeout(function () {
            this.onclose();
        }.bind(this), 10 * 1000);
    }
}

var ws = new FakeWebsocket();

var client = new AirmashClient('', false,
    { name: 'STATSBOT', owner: '' },
    function () {
        return ws;
    }, true);

ws.runtest();
