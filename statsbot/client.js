'use strict';

const WebSocket = require('ws');
const GameAssets = require('./gamecode');
const throttledQueue = require('throttled-queue');

const SERVERPACKET = GameAssets.serverPacket;
const CLIENTPACKET = GameAssets.clientPacket;
const encodeMessage = GameAssets.encodeMessage;
const decodeMessage = GameAssets.decodeMessage;

class AirmashClient {
    constructor(serverURL, restartOnDc, botInfo, buildwsfn, noDecode) {
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
        this.decode = !!noDecode;
        this.open = false;
        this.firstgame = true;

        //this.queue = throttledQueue(16, 200);

        this.isthrottled = false;
        this.isbanned = false;

        this.players = {};
        this.redteam = new Set();
        this.blueteam = new Set();

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
        //this.queue(function () {
            // TODO: Retry after a timeout?
            if (!this.open)
                return;

            if (!this.noDecode)
                this.ws.send(encodeMessage(packet));
            else
                this.ws.send(packet);
        //});
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
                this.blueteam.add(player.id);
            }
            else {
                this.redteam.add(player.id);
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
            this.blueteam.add(packet.id);
        }
        else {
            this.redteam.add(packet.id);
        }
    }
    _handlePlayerLeave(packet) {
        if (this.players[packet.id].team === 1) {
            this.blueteam.delete(packet.id);
        }
        else {
            this.redteam.delete(packet.id);
        }

        delete this.players[packet.id];
    }
    _handleReteam(packet) {
        this.spectating = false;
        
        for (let i in packet.players) {
            let player = packet.players[i];

            this.players[player.id].team = player.team;

            if (player.team === 2) {
                // Player is joining red team
                this.blueteam.delete(player.id);
                this.redteam.add(player.id);
            }
            else {
                // Player is joining blue team
                this.redteam.delete(player.id);
                this.blueteam.delete(player.id);
            }
        }

        let me = this;
        setTimeout(function () {
            me.gameStart = new Date();
            this.firstgame = false;
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
        if (packet.id === this.id) {
            this.spectating = false;
        }
    }
    _handleError(packet) {
        switch (packet.error) {
            case 1: // Disconnect for packet flooding
                this.isthrottled = true;
                setTimeout(function () {
                    this.isthrottled = false;
                }, 60 * 1000);
                break;
            case 2: // Banned for packet flooding
            case 3: // Banned gobally
                this.isbanned = true;
                break;
        }
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
            case SERVERPACKET.PLAYER_RETEAM:
                this._handleReteam(packet);
                break;
            case SERVERPACKET.PLAYER_RESPAWN:
                this._handlePlayerRespawn(packet);
                break;
            case SERVERPACKET.ERROR:
                this._handleError(packet);
                break;
        }
    }

    onopen() {
        let info = this.info;
        this.open = true;

        this.send({
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
        });

        this.callbacks.open();
    }
    onmessage(msg) {
        var packet = msg;
        if (!this.noDecode)
            packet = decodeMessage(msg);

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
        this.open = false;

        if (this.isbanned) {
            setTimeout(function () {
                this.isbanned = false;
                this.onclose(msg, code, reason);
            }.bind(this), 60 * 60 * 1000);
            return;
        }
        else if (this.isthrottled) {
            setTimeout(function () {
                this.isthrottled = false;
                this.onclose(msg, code, reason);
            }.bind(this), 60 * 1000);
        }

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
