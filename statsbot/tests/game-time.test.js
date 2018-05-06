"use strict";

const AirmashClient = require('./../client');
const GameAssets = require('./../gamecode');

const encodeMessage = GameAssets.encodeMessage;
const decodeMessage = GameAssets.decodeMessage;

const SERVERPACKET = GameAssets.serverPacket;
const CLIENTPACKET = GameAssets.clientPacket;

var client = {};

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
        var me = this;

        this.onopen();

        this.onmsg({
            c: SERVERPACKET.LOGIN,
            success: true,
            id: 1,
            team: 1,
            clock: 0,
            token: 'none',
            type: 1,
            room: 'ctf1',
            players: [
                {
                    id: 1,
                    status: 0,
                    level: 0,
                    name: 'STATSBOT',
                    type: 1,
                    team: 1,
                    posX: 0.0,
                    posY: 0.0,
                    rot: 0.0,
                    flag: 0,
                    upgrades: 0
                }
            ]
        });
        this.onmsg({
            c: SERVERPACKET.PLAYER_RETEAM,
            players: [
                { id: 1, team: 1 }
            ]
        });

        setTimeout(function () {
            console.log(new Date() - client.gameStart);
            me.onclose();
        }, 30.2 * 1000);
    }
}

var ws = new FakeWebsocket();

client = new AirmashClient('', false,
    { name: 'STATSBOT', owner: '' },
    function () {
        return ws;
    }, true);

ws.runtest();
