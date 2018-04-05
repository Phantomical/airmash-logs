'use strict';

const WebSocket = require('ws');
const GameAssets = require('./gamecode');

const SERVERPACKET = GameAssets.serverPacket;
const CLIENTPACKET = GameAssets.clientPacket;
const encodeMessage = GameAssets.encodeMessage;
const decodeMessage = GameAssets.decodeMessage;
const PlayHost = GameAssets.playHost;
const PlayPath = GameAssets.playPath;

const OWNER = "STEAMROLLER"
const MYNAME = "BALANCEBOT"

function processChatPublic(packet) {
    if (packet.text.toUpperCase() === "-BOT-PING") {
        setTimeout(function () {
            client.send(encodeMessage({
                c: CLIENTPACKET.WHISPER,
                id: packet.id,
                text: "I am " + MYNAME + ", my purpose is to log all server packets. Owner: " + OWNER
            }))
        }, 500);
    }
}

function logError(packet) {
    let obj = {};

    switch (packet.error) {
        case 1:
            obj = {
                error: "DISCONNECTED",
                explanation: "Packet flooding detected"
            };
            break;
        case 2:
            obj = {
                error: "BANNED",
                explanation: "Packet flooding detected"
            };
            break;
        case 3:
            obj = {
                error: "BANNED",
                explanation: "You have been globally banned"
            };
            break;
        case 5:
            obj = {
                error: "RESPAWN",
                explanation: "Full health and 2 seconds of inactivity required"
            };
            break;
        case 6:
            obj = {
                error: "DISCONNECTED",
                explanation: "AFK for more than 10 minutes"
            };
            break;
        case 7:
            obj = {
                error: "DISCONNECTED",
                explanation: "You have been kicked out"
            };
            break;
        case 8:
            obj = {
                error: "DISCONNECTED",
                explanation: "Invalid login data"
            };
            break;
        case 9:
            obj = {
                error: "DISCONNECTED",
                explanation: "Incorrect protocol level"
            };
            break;
        case 10:
            obj = {
                error: "BANNED",
                explanation: "Account Banned"
            };
            break;
        case 11:
            obj = {
                error: "DISCONNECTED",
                explanation: "Account already logged in"
            };
            break;
        case 12:
            obj = {
                error: "RESPAWN",
                explanation: "Cannot respawn or change aircraft in a BTR game"
            };
            break;
        case 13:
            obj = {
                error: "SPECTATE",
                explanation: "Full health and 2 seconds of inactivity required"
            };
            break;
        case 20:
            obj = {
                error: "UPGRADE",
                explanation: "Not enough upgrades"
            };
            break;
        case 30:
            obj = {
                error: "THROTTLED",
                explanation: "Chat throttled to prevent spamming"
            };
            break;
        case 31:
            obj = {
                error: "THROTTLED",
                explanation: "Flag change too fast"
            };
            break;
        case 100:
            obj = {
                error: "UNKNOWN COMMAND",
                explanation: "Unknown Command"
            };
            break;
    }

    console.log(JSON.stringify(obj));
}

const onmessage = function (e) {
    var t = decodeMessage(e);

    if (t.c == SERVERPACKET.PING) {
        client.send(encodeMessage({
            c: CLIENTPACKET.PONG,
            num: t.num
        }));
    }
    else if (t.c == SERVERPACKET.ERROR) {
        logError(t);
    }
    else {
        logPacket(t);
    }
};
const onopen = function () {
    client.send(encodeMessage({
        c: CLIENTPACKET.LOGIN,
        // This has to be 5 otherwise the server will send an error
        protocol: 5,
        name: MYNAME,
        // Login token for a signed-in player
        session: 'none',
        // Expand view range of bot
        horizonX: (1 << 16) - 1,
        horizonY: (1 << 16) - 1,
        flag: 'ca'
    }));

    // Make statsbot spectate on joining    
    setTimeout(function () {
        client.send(encodeMessage({
            c: CLIENTPACKET.COMMAND,
            com: "spectate",
            data: "-3"
        }));
    }, 1000);
};
const onclose = function () {
    client = new WebSocket('wss://game-' + PlayHost + '.airma.sh/' + PlayPath);
    client.binaryType = 'arraybuffer';

    client.on('close', onclose);
    client.on('open', onopen);
    client.on('message', onmessage);
}

client.on('open', onopen);
client.on('message', onmessage);
client.on('close', onclose);

bots = []
names = {}
teams = [[], []]
otherbots = []

knownbots = [
    "STATSBOT",
    "LOGBOT",
    "SAGGYBOT",
    "SHITBOT",
    "SUFFLEBOT",
    "SIGMABOT",
    "STUPIDBOT"
]

function isKnownBot(name) {
    for (var idx in knownbots) {
        if (name === knownbots[idx]) {
            return true;
        }
    }
    return false;
}

function processLogin(packet) {
    bots.push(packet.id);

    for (var idx in packet.players) {
        var player = packet.players[idx];

        names[player.id] = player.name;

        teams[player.team - 1].push(player.id);

        if (isKnownBot(name)) {
            otherbots.push({ id: player.id, team: player.team });
        }
    }
}
function processPlayerNew(packet) {
    names[player.id] = player.name;
    teams[player.team - 1].push(player.id);
}
function processPlayerLeave(packet) {
    delete names[player.id];
    names = names.filter(function (item) {
        return item !== player.id;
    });

    teams[0] = teams[0].filter(function (item) {
        return item !== player.id;
    });
    teams[1] = teams[1].filter(function (item) {
        return item !== player.id;
    });
}
function processPlayerReteam(packet) {
    teams = [[],[]]
    for (var idx in packet.players) {
        var player = packet.players[idx];

        teams[player.team - 1].push(player.id);
    }

    // Kill all bots but the main bot
    for (var idx = 0; idx < bots.length; idx++) {
        bots[idx].drop();
    }

    bots = [new BalanceBot(MYNAME, true)];

    setTimeout(bots[0].balance(), 5000);
}

class BalanceBot {
    drop() {
        this.ws.close();
        this.dropped = true;
    }

    onmessage(e) {
        const packet = decodeMessage(e);

        if (packet.c === SERVERPACKET.PING) {
            client.send(encodeMessage({
                c: CLIENTPACKET.PONG,
                num: t.num
            }));
        }
        else if (packet.c === SERVERPACKET.LOGIN) {
            this.selfID = packet.id;
            this.team = packet.team;

            if (this.isoperator) {
                processLogin(packet);
            }
        }
        else if (packet.c === SERVERPACKET.CHAT_PUBLIC) {
            if (packet.text.toUpperCase() === "-BOT-PING") {
                setTimeout(function () {
                    client.send(encodeMessage({
                        c: CLIENTPACKET.WHISPER,
                        id: packet.id,
                        text: "I am " + MYNAME + ", owner: " + OWNER
                    }))
                }, 500);
            }
        }

        if (this.isoperator) {
            if (packet.c === SERVERPACKET.PLAYER_NEW) {
                processPlayerNew(packet);
            }
            else if (packet.c === SERVERPACKET.PLAYER_LEAVE) {
                processPlayerLeave(packet);
            }
            else if (packet.c === SERVERPACKET.PLAYER_RETEAM) {
                processPlayerReteam(packet);
            }
        }
    }
    onopen(e) {
        this.ws.send(encodeMessage({
            c: CLIENTPACKET.LOGIN,
            // This has to be 5 otherwise the server will send an error
            protocol: 5,
            name: MYNAME,
            // This might be different for a signed-in player
            // not sure what this does either
            session: 'none',
            // Minimal view range to reduce server load
            horizonX: 1,
            horizonY: 1,
            flag: 'ca'
        }));
    }

    balance() {
        if (!this.isoperator) return;

        const red = teams[0].length;
        const blue = teams[1].length;


    }

    constructor(name, isoperator) {
        this.isoperator = isoperator;
        this.ws = new WebSocket('wss://game-' + PlayHost + '.airma.sh/' + PlayPath);
        this.ws.binaryType = 'arraybuffer';

        this.selfID = 0;
        this.dropped = false;
        this.team = 0;
    }

}