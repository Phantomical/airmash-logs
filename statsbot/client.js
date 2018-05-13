'use strict';

const EventEmitter = require('events');
const WebSocket = require('ws');
const GameAssets = require('./gamecode');
const throttledQueue = require('throttled-queue');

const SERVERPACKET = GameAssets.serverPacket;
const CLIENTPACKET = GameAssets.clientPacket;
const encodeMessage = GameAssets.encodeMessage;
const decodeMessage = GameAssets.decodeMessage;

function decodePacketType(type) {
    const packetTypes = {
        0: "LOGIN",
        1: "BACKUP",
        5: "PING",
        6: "PING_RESULT",
        7: "ACK",
        8: "ERROR",
        9: "COMMAND_REPLY",
        10: "PLAYER_NEW",
        11: "PLAYER_LEAVE",
        12: "PLAYER_UPDATE",
        13: "PLAYER_FIRE",
        14: "PLAYER_HIT",
        15: "PLAYER_RESPAWN",
        16: "PLAYER_FLAG",
        17: "PLAYER_KILL",
        18: "PLAYER_UPGRADE",
        19: "PLAYER_TYPE",
        20: "PLAYER_POWERUP",
        21: "PLAYER_LEVEL",
        22: "PLAYER_RETEAM",
        30: "GAME_FLAG",
        31: "GAME_SPECTATE",
        32: "GAME_PLAYERSALIVE",
        33: "GAME_FIREWALL",
        40: "EVENT_REPEL",
        41: "EVENT_BOOST",
        42: "EVENT_BOUNCE",
        43: "EVENT_STEALTH",
        44: "EVENT_LEAVEHORIZON",
        60: "MOB_UPDATE",
        61: "MOB_UPDATE_STATIONARY",
        62: "MOB_DESPAWN",
        63: "MOB_DESPAWN_COORDS",
        70: "CHAT_PUBLIC",
        71: "CHAT_TEAM",
        72: "CHAT_SAY",
        73: "CHAT_WHISPER",
        78: "CHAT_VOTEMUTEPASSED",
        79: "CHAT_VOTEMUTED",
        80: "SCORE_UPDATE",
        81: "SCORE_BOARD",
        82: "SCORE_DETAILED",
        83: "SCORE_DETAILED_CTF",
        84: "SCORE_DETAILED_BTR",
        90: "SERVER_MESSAGE",
        91: "SERVER_CUSTOM"
    };

    return packetTypes[type];
}

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
        this.decode = !noDecode;
        this.open = false;
        this.firstgame = true;
        this.evttgt = new EventEmitter();

        this.isthrottled = false;
        this.isbanned = false;

        this.players = {};
        this.redteam = new Set();
        this.blueteam = new Set();

        this.redscore = 0;
        this.bluescore = 0;

        this._registerCallbacks();

        let me = this;
        this.ws.on("open", function () { me.onopen(); });
        this.ws.on("message", function (msg) { me.onmessage(msg); });
        this.ws.on("close", function (a, b, c) { me.onclose(a, b, c); });
    }

    // Register a listener for a packet
    // to hook into all packets, use "packet"
    on(type, fn) {
        this.evttgt.on(type, fn);
    }
    // Send and encode a packet over the websocket
    send(packet) {
        // TODO: Retry after a timeout?
        if (!this.open)
            return;

        if (this.decode)
            this.ws.send(encodeMessage(packet));
        else
            this.ws.send(packet);
    }

    close() {
        this.ws.close();
    }

    _registerCallbacks() {
        this.evttgt.on("LOGIN", this._handleLogin.bind(this));
        this.evttgt.on("PLAYER_NEW", this._handlePlayerNew.bind(this));
        this.evttgt.on("PLAYER_LEAVE", this._handlePlayerLeave.bind(this));
        this.evttgt.on("PLAYER_RETEAM", this._handleReteam.bind(this));
        this.evttgt.on("PLAYER_LEVEL", this._handlePlayerLevel.bind(this));
        this.evttgt.on("PLAYER_TYPE", this._handlePlayerType.bind(this));
        this.evttgt.on("PLAYER_FLAG", this._handlePlayerFlag.bind(this));
        this.evttgt.on("PLAYER_RESPAWN", this._handlePlayerRespawn.bind(this));
        this.evttgt.on("ERROR", this._handleError.bind(this));
        this.evttgt.on("SCORE_BOARD", this._handleScoreBoard.bind(this));
        this.evttgt.on("SERVER_CUSTOM", this._handleServerCustom.bind(this));
        this.evttgt.on("GAME_SPECTATE", this._handleGameSpectate.bind(this));
    }

    _handleLogin(packet) {
        this.spectating = false;
        this.id = packet.id;
        this.team = packet.team;

        this.players = {};
        this.redteam = new Set();
        this.blueteam = new Set();

        for (let i in packet.players) {
            let player = packet.players[i];

            this.players[player.id] = {
                name: player.name,
                level: player.level,
                type: player.type,
                team: player.team,
                flag: player.flag,
                spec: 0
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
            flag: packet.flag,
            spec: 0
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

            if (player.id === this.id) {
                this.team = player.team;
            }

            if (player.team === 2) {
                // Player is joining red team
                this.blueteam.delete(player.id);
                this.redteam.add(player.id);
            }
            else {
                // Player is joining blue team
                this.redteam.delete(player.id);
                this.blueteam.add(player.id);
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
    _handleScoreBoard(packet) {
        for (let idx in packet.rankings) {
            let player = packet.rankings[idx];

            if (!this.players[player.id]) {
                console.log("[ERR_UNKNOWN_PLAYER, id: " + player.id + "]");
                continue;
            }

            if (player.x == 0 && player.y == 0) {
                this.players[player.id].spec += 1;
            }
            else {
                this.players[player.id].spec = 0;
            }
        }
    }
    _handleServerCustom(packet) {
        this.lastWinner = JSON.parse(packet.data).w;
    }
    _handleGameSpectate(packet) {
        this.spectating = true;
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

        this.evttgt.emit("open");
    }
    onmessage(msg) {
        var packet = msg;
        if (this.decode)
            packet = decodeMessage(msg);

        if (packet.c === SERVERPACKET.PING) {
            this.send({
                c: CLIENTPACKET.PONG,
                num: packet.num
            });
        }
        else {
            this.evttgt.emit("packet", packet);
            this.evttgt.emit(decodePacketType(packet.c), packet);
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

        this.evttgt.emit("close");
    }
}

module.exports = AirmashClient;
