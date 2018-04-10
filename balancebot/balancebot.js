'use strict';

const WebSocket = require('ws');
const GameAssets = require('./gamecode');

const SERVERPACKET = GameAssets.serverPacket;
const CLIENTPACKET = GameAssets.clientPacket;
const encodeMessage = GameAssets.encodeMessage;
const decodeMessage = GameAssets.decodeMessage;
const playHost = GameAssets.playHost;
const playPath = GameAssets.playPath;

const hostURL = 'wss://game-' + playHost + '.airma.sh/' + playPath;

const OWNER = "STEAMROLLER"
const MYNAME = "BALANCEBOT"
// This shouldn't be set above 8
const MAXBOTS = 4;

const REDTEAM = 0;
const BLUETEAM = 1;

var bots = [];
var teams = [[], []];
var balancebots = [];

var knownbots = [
    "STATSBOT",
    "LOGBOT"
];

function isKnownBot(name) {
    for (var idx in knownbots) {
        if (name === knownbots[idx]) {
            return true;
        }
    }
    return false;
}

function initialize() {
    bots.push(new BalanceBot(true));
}
function startBots(numbots) {
    for (var i = 0; i < numbots; ++i) {
        bots.push(new BalanceBot(false));
    }
}
function removeUnneeded(req_red, req_blue) {
    if (req_blue === undefined) {
        if (req_red <= 0) return remove_unneeded(0, -req_red);
        return remove_unneeded(req_red, 0);
    }

    redcnt = 0;
    bluecnt = 0;

    for (var i = 0; i < bots.length; ++i) {
        if (bots[i].myTeam === REDTEAM) {
            if (redcnt >= req_red) {
                bots[i].close();
            }
            redcnt++;
        }
        else {
            if (bluecnt >= req_blue) {
                bots[i].close();
            }
            bluecnt++;
        }
    }

    bots = bots.filter(function (bot) { return bot.closed; });

    if (bots.length != 0) {
        bots[0].am_operator = true;
    }
}
function botsToJoin(nred, nblue, botsred, botsblue, controllerteam) {
    if (botsred === botsblue)
        return 0;

    var teamdiff = Math.abs(nred - nblue);
    var botdiff = Math.abs(botsred - botsblue);

    return teamdiff + 2 * Math.max(botdiff - teamdiff, 0);
}
function balance() {
    const nred = teams[0].length;
    const nblue = teams[1].length;

    const redbots = teams[0].filter(function (item) {
        return bots.indexOf(item) > -1;
    }).length;
    const bluebots = teams[1].filter(function (item) {
        return bots.indexOf(item) > -1;
    }).length;

    setTimeout(function () {
        removeUnneeded(botdiff);
    }, 1 * 1000);

    if (balancebots.length === 0) {
        setTimeout(initialize, 10 * 60 * 1000);
    }
}


class BalanceBot {
    constructor(am_operator) {
        this.am_operator = am_operator;
        this.ws = new WebSocket(hostURL);
        this.myID = 0;
        this.myTeam = 0;
        this.closed = false;
        this.isneeded = false;

        this.ws.onopen = this.onopen;
        this.ws.onmessage = this.onmessage;
        this.ws.onclose = this.onclose;
    }

    close() {
        this.closed = true;
        this.ws.close();
    }

    onopen() {
        ws.send(encodeMessage({
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
    }
    onmessage(msg) {
        var packet = decodeMessage(msg);

        if (packet.c === SERVERPACKET.PING) {
            this.ws.send(encodeMessage({
                c: CLIENTPACKET.PONG,
                num: packet.num
            }));
        }
        else if (packet.c === SERVERPACKET.LOGIN) {
            this.selfID = packet.id;
            this.myTeam = packet.team;

            if (this.am_operator) {
                teams = [[], []];
                bots = [];

                for (var idx in packet.players) {
                    var player = packet.players[idx];

                    teams[player.team - 1].push(player.id);

                    if (isKnownBot(player.name)) {
                        bots.add(player.id);
                    }
                }
            }
        }
        else if (packet.c === SERVERPACKET.PLAYER_NEW) {
            if (this.am_operator) {
                teams[packet.team - 1] = packet.id;

                if (isKnownBot(player.name)) {
                    bots.add(packet.id);
                }
            }
        }
        else if (packet.c === SERVERPACKET.PLAYER_LEAVE) {
            if (this.am_operator) {
                var redidx = teams[0].indexOf(packet.id);
                var blueidx = teams[1].indexOf(packet.id);

                if (redidx > -1) {
                    teams[0].splice(redidx);
                }
                if (blueidx > -1) {
                    teams[1].splice(blueidx);
                }

                var botidx = bots.indexOf(packet.id);

                if (botidx > -1) {
                    bots.splice(packet.id);

                    for (var i = balancebots.length; i >= 0; ++i) {
                        if (balancebots[i].team == packet.team) {
                            balancebots[i].close()
                            balancebots.splice(i);
                        }
                    }
                }
            }
        }
        else if (packet.c === SERVERPACKET.SERVER_CUSTOM) {
            this.close()

            balancebots = []

            // Leave until after reteam
            setTimeout(function () {
                var bot = new BalanceBot(true);
                balancebots.push(bot);

                bot.balance();
            }, 31 * 1000);
        }
        else if (packet.c === SERVERPACKET.CHAT_PUBLIC) {
            if (packet.text.toUpperCase() === '-BOT-PING') {
                this.ws.send(encodeMessage({
                    c: CLIENTPACKET.WHISPER,
                    id: packet.id,
                    text: "I am " + MYNAME + " . My purpose is to " +
                        "ensure there are the same number of bots " +
                        "on each team. Owner: " + OWNER
                }))
            }
        }
    }
    onclose() {

    }
}

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




