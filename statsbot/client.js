'use strict';

const WebSocket = require('ws');
const GameAssets = require('./gamecode');

const SERVERPACKET = GameAssets.serverPacket;
const CLIENTPACKET = GameAssets.clientPacket;
const encodeMessage = GameAssets.encodeMessage;
const decodeMessage = GameAssets.decodeMessage;

class AirmashClient {
    constructor(serverURL, restartOnDc, botInfo, buildwsfn) {
        if (!buildwsfn) {
            buildwsfn = function (url) {
                return new WebSocket(serverURL);
            };
        }

        this.ws = buildwsfn(serverURL);
        this.ws.binaryType = 'arraybuffer';

        this.id = 0;
        this.team = 0;
        this.info = botInfo;
        this.gameStart = new Date();
        this.spectating = false;
        this.lastWinner = 0;
        this.restartOnDc = restartOnDc;
        this.serverURL = serverURL;
        this.buildwsfn = buildwsfn;

        this.players = {};
        this.redteam = [];
        this.blueteam = [];

        this.callbacks = {};

        this.redscore = 0;
        this.bluescore = 0;

        this.callbacks = {
            packet: function () { },
            close: function () { },
            open: function () { }
        };

        let me = this;
        this.ws.on("open", function () { me.onopen(); });
        this.ws.on("message", function (msg) { me.onmessage(msg); });
        this.ws.on("close", function (a, b, c) { me.onclose(a, b, c); });
    }

    // Register a listener for a packet
    // to hook into all packets, override onpacket
    on(type, fn) {
        this.callbacks[type] = fn;
    }
    // Send and encode a packet over the websocket
    send(packet) {
        this.ws.send(encodeMessage(packet));
    }

    _handleLogin(packet) {
        this.spectating = false;
        this.id = packet.id;
        this.team = packet.team;

        this.players = {};
        this.redteam = [];
        this.blueteam = [];

        for (let i in packet.players) {
            let player = packet.players[i];

            this.players[player.id] = {
                name: player.name,
                level: player.level,
                type: player.type,
                team: player.team,
                flag: player.flag
            };

            if (player.team === 1) {
                this.blueteam.push(player.id);
            }
            else {
                this.redteam.push(player.id);
            }
        }
    }
    _handlePlayerNew(packet) {
        this.players[packet.id] = {
            name: packet.name,
            level: packet.level,
            type: packet.type,
            team: packet.team,
            flag: packet.flag
        };

        if (packet.team === 1) {
            this.blueteam.push(packet.id);
        }
        else {
            this.redteam.push(packet.id);
        }
    }
    _handlePlayerLeave(packet) {
        let redidx = this.redteam.indexOf(packet.id);
        let bluidx = this.blueteam.indexOf(packet.id);

        this.redteam.splice(redidx);
        this.blueteam.splice(bluidx);

        delete this.players[packet.id];
    }
    _handleReteam(packet) {
        this.spectating = false;

        this.redteam = [];
        this.blueteam = [];

        for (let i in packet.players) {
            let player = packet.players[i];

            this.players[player.id].team = player.team;

            if (player.team === 1) {
                this.redteam.push(player.id);
            }
            else {
                this.blueteam.push(player.id);
            }
        }

        let me = this;
        setTimeout(function () {
            me.gameStart = new Date();
        }, 30 * 1000);
    }
    _handlePlayerLevel(packet) {
        this.players[packet.id].level = packet.level;
    }
    _handlePlayerType(packet) {
        this.players[packet.id].type = packet.type;
    }
    _handlePlayerFlag(packet) {
        this.players[packet.id].flag = packet.flag;
    }
    _handlePlayerRespawn(packet) {
        this.spectating = false;
    }

    _messageHandler(packet) {
        this.callbacks.packet(packet);
        if (!!this.callbacks[packet.c]) {
            this.callbacks[packet.c](packet);
        }

        switch (packet.c) {
            case SERVERPACKET.GAME_SPECTATE:
                this.spectating = true;
                break;
            case SERVERPACKET.PLAYER_RESPAWN:
                this._handlePlayerRespawn(packet);
                break;
            case SERVERPACKET.SERVER_CUSTOM:
                this.lastWinner = JSON.parse(packet.data).w;
                break;
            case SERVERPACKET.LOGIN:
                this._handleLogin(packet);
                break;
            case SERVERPACKET.PLAYER_NEW:
                this._handlePlayerNew(packet);
                break;
            case SERVERPACKET.PLAYER_LEAVE:
                this._handlePlayerLeave(packet);
                break;
            case SERVERPACKET.PLAYER_TYPE:
                this._handlePlayerType(packet);
                break;
            case SERVERPACKET.PLAYER_LEVEL:
                this._handlePlayerLevel(packet);
                break;
            case SERVERPACKET.PLAYER_FLAG:
                this._handlePlayerFlag(packet);
                break;
        }
    }

    onopen() {
        let info = this.info;

        this.ws.send(encodeMessage({
            c: CLIENTPACKET.LOGIN,
            // Current server protocol version, must be 5
            protocol: 5,
            name: info.name,
            // Login session for a signed-in player
            session: !!info.session ? info.session : 'none',
            // View range of bot (approximately)
            horizonX: !!info.horizonX ? info.horizonX : 1000,
            horizonY: !!info.horizonY ? info.horizonY : 1000,
            // Flag of bot, default is UN flag
            flag: !!info.flag ? info.flag : 'XX'
        }));

        this.callbacks.open();
    }
    onmessage(msg) {
        var packet = decodeMessage(msg);

        if (packet.c === SERVERPACKET.PING) {
            this.send({
                c: CLIENTPACKET.PONG,
                num: packet.num
            });
        }
        else {
            this._messageHandler(packet);
        }
    }
    onclose(msg, code, reason) {
        if (this.restartOnDc) {
            this.ws = this.buildwsfn(this.serverURL);
            this.ws.binaryType = 'arraybuffer';

            let me = this;

            this.ws.on("open", function () { me.onopen(); });
            this.ws.on("message", function (msg) { me.onmessage(msg); });
            this.ws.on("close", function (a, b, c) { me.onclose(a, b, c); });
        }

        this.callbacks.close(msg, code, reason);
    }
}

module.exports = AirmashClient;
