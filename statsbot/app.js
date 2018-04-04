'use strict';

if (!Buffer.alloc) {
    Buffer.alloc = function (size, fill) {
        var buf = new Buffer(size);
        if (!fill) {
            buf.fill(0);
        }
        else {
            buf.fill(fill);
        }
        return buf;
    }
}

const WebSocket = require('ws');
const GameAssets = require('./gamecode');
const Logger = require('./logger');

const SERVERPACKET = GameAssets.serverPacket;
const CLIENTPACKET = GameAssets.clientPacket;
const encodeMessage = GameAssets.encodeMessage;
const decodeMessage = GameAssets.decodeMessage;
const PlayHost = GameAssets.playHost;
const PlayPath = GameAssets.playPath;

// Suppress PLAYER_UPDATE
Logger.active_info = true;
Logger.debug_info = true;

var OWNER = "STEAMROLLER"
var MYNAME = "STATSBOT"

// Check that we are running in nodejs
if (typeof module !== 'undefined' && module.exports) {
    if (process.argv.length >= 2) {
        OWNER = process.argv[1];
    }
}

var client = new WebSocket('wss://game-' + PlayHost + '.airma.sh/' + PlayPath);
client.binaryType = 'arraybuffer';

var selfID = 0;
var ownerID = 0;
var flagCarrierRed = 0;
var flagCarrierBlue = 0;
var gameStart = new Date();

function processLogin(packet) {
    selfID = packet.id;
    Logger.log("LOGIN", {});

    for (var idx in packet.players) {
        const player = packet.players[idx];

        Logger.log("PLAYER_NEW", {
            id: player.id,
            flag: player.flag,
            team: player.team,
            type: player.type,
            upgrades: player.upgrades,
            name: player.name
        });
        Logger.log("PLAYER_LEVEL", {
            id: player.id,
            level: player.level
        });

        if (player.name === OWNER) {
            ownerID = packet.id;
        }
    }

}
function processPlayerNew(packet) {
    Logger.log("PLAYER_NEW", {
        id: packet.id,
        team: packet.team,
        flag: packet.flag,
        type: packet.type,
        upgrades: packet.upgrades,
        name: packet.name
    });

    if (packet.name === OWNER) {
        ownerID = packet.id;
    }
}
function processPlayerLeave(packet) {
    Logger.log("PLAYER_LEAVE", { id: packet.id });

    if (packet.id == ownerID) {
        ownerID = 0;
    }
}
function processPlayerLevel(packet) {
    Logger.log("PLAYER_LEVEL", {
        id: packet.id,
        level: packet.level
    });
}
function processPlayerKill(packet) {
    Logger.log("PLAYER_KILL", {
        id: packet.id,
        killer: packet.killer,
        pos: [packet.posX, packet.posY]
    });
}
function processReteam(packet) {
    for (var idx in packet.players) {
        const player = packet.players[idx];

        Logger.log("PLAYER_RETEAM", {
            id: player.id,
            team: player.team
        });
    }
    
    gameStart = new Date();
}
function processDetailedScore(packet) {
    // TODO: Fill this in
}
function processWhisper(packet) {
    // Apparently packet.from is the current player 
    if (packet.to == ownerID || packet.from == ownerID) {
        if (packet.text === ':restart') {
            process.exit(2)
        }
        else if (packet.text === ':shutdown') {
            process.exit(56)
        }
    }

    if (packet.text.toUpperCase() === '-GAME-TIME') {
        setTimeout(function () {
            var msPerMinute = 60 * 1000;
            var msPerHour = msPerMinute * 60;

            var time = new Date() - gameStart;
            var text = '' + Math.floor(time / msPerHour) +
                ' hours, ' + (Math.floor(time / msPerMinute) % 60) +
                ' minutes, and ' + (Math.floor(time / 1000) % 60) +
                ' seconds have elapsed since this game started.';

            client.send(encodeMessage({
                c: CLIENTPACKET.WHISPER,
                id: packet.from,
                text: text
            }))
        }, 500);
    }
    else if (packet.text.toUpperCase() === "HELP") {
        setTimeout(function () {
            client.send(encodeMessage({
                c: CLIENTPACKET.WHISPER,
                id: packet.from,
                text: "whisper commands: -game-time, -anon-me"
            }))
        }, 500);
    }
    else if (packet.text.toUpperCase() == "-ANON-ME") {
        Logger.log("ANONYMISE", { id: packet.from });

        setTimeout(function () {
            client.send(encodeMessage({
                c: CLIENTPACKET.WHISPER,
                id: packet.from,
                text: "You will now be anonymised from STATSBOT logs for this session."
            }))
        }, 200);
        setTimeout(function () {
            client.send(encodeMessage({
                c: CLIENTPACKET.WHISPER,
                id: packet.from,
                text: "To avoid seeing this message, use -anon-me-quiet for anonymization requests."
            }))
        }, 400);
    }
    else if (packet.text.toUpperCase() == '-ANON-ME-QUIET') {
        Logger.log("ANONYMISE", { id: packet.from });
    }
}
function processChatPublic(packet) {
    if (packet.text.toUpperCase() === "-SWAM-PING") {
        setTimeout(function () {
            client.send(encodeMessage({
                c: CLIENTPACKET.WHISPER,
                id: packet.id,
                text: "I'm using STARMASH, theme: " + MYNAME
            }))
        }, 500);
    }
    else if (packet.text.toUpperCase() === "-BOT-PING") {
        setTimeout(function () {
            client.send(encodeMessage({
                c: CLIENTPACKET.WHISPER,
                id: packet.id,
                text: "I am " + MYNAME + ", owner: " + OWNER
            }))
        }, 500);
    }
    else if (packet.text.toUpperCase() === "-PROW-PING") {
        setTimeout(function () {
            client.send(encodeMessage({
                c: CLIENTPACKET.WHISPER,
                id: packet.id,
                text: "STATSBOT cannot find prowlers for you :("
            }))
        }, 500);
    }
    else if (packet.text.toUpperCase() === '-GAME-TIME') {
        setTimeout(function () {
            var msPerMinute = 60 * 1000;
            var msPerHour = msPerMinute * 60;

            var time = new Date() - gameStart;
            var text = '' + Math.floor(time / msPerHour) +
                ' hours, ' + (Math.floor(time / msPerMinute) % 60) +
                ' minutes, and ' + (Math.floor(time / 1000) % 60) +
                ' seconds have elapsed since this game started.';

            client.send(encodeMessage({
                c: CLIENTPACKET.CHAT,
                text: text
            }))
        }, 500);
    }
    else {
        Logger.log("CHAT_PUBLIC", {
            id: packet.id,
            text: packet.text
        });
    }
}
function processPlayerRespawn(packet) {
    if (packet.id == selfID) {
        // Make statsbot spectate on new game   
        setTimeout(function () {
            client.send(encodeMessage({
                c: CLIENTPACKET.COMMAND,
                com: "spectate",
                data: "-3"
            }));
        }, 5 * 1000);
    }
}
function processServerMessage(packet) {
    // do nothing for now
    return;
    const options = {
        0: '<span class="info inline"><span class="red flag"></span></span>Taken by ',
        1: '<span class="info inline"><span class="red flag"></span></span>Returned by ',
        2: '<span class="info inline"><span class="red flag"></span></span>Captured by ',
        3: '<span class="info inline"><span class="blue flag"></span></span>Taken by ',
        4: '<span class="info inline"><span class="blue flag"></span></span>Returned by ',
        5: '<span class="info inline"><span class="blue flag"></span></span>Captured by ',
    };
    var msg = {};

    if (packet.message.startsWith(options[0])) {
        msg = {
            subject: "flag taken",
            flag: 1,

        }
    }
}
function processPlayerType(packet) {
    Logger.log("PLAYER_TYPE", {
        id: packet.id,
        type: packet.type
    });
}
function processGameFlag(packet) {
    if (packet.id !== 0) {
        Logger.log("FLAG_TAKEN", {
            id: packet.id,
            flag: packet.flag,
            type: packet.type
        });
        if (packet.flag == 1) {
            flagCarrierBlue = packet.id;
        }
        else if (packet.flag == 2) {
            flagCarrierRed = packet.id;
        }
    }
    else {
        Logger.log("FLAG_RETURNED", {
            flag: packet.flag,
            // 1 indicates return, 2 indicates cap
            type: packet.type
        });
        if (packet.flag == 1) {
            flagCarrierBlue = 0;
        }
        else if (packet.flag == 2) {
            flagCarrierRed = 0;
        }
    }
}
function processPlayerUpdate(packet) {
    if (packet.id == flagCarrierRed) {
        Logger.log("FLAG_UPDATE", {
            flag: 2,
            carrier: packet.id,
            pos: [packet.posX, packet.posY]
        });
    }
    else if (packet.id == flagCarrierBlue) {
        Logger.log("FLAG_UPDATE", {
            flag: 1,
            carrier: packet.id,
            pos: [packet.posX, packet.posY]
        });
    }

    Logger.optional("PLAYER_UPDATE", {
        id: packet.id,
        upgrades: packet.upgrades,
        pos: [packet.posX, packet.posY]
    });
}
function processLeaveHorizon(packet) {
    Logger.debug("LEAVE_HORIZON", {
        id: packet.id,
        type: packet.type
    });
}
function processPlayerHit(packet) {
    for (var idx in packet.players) {
        const player = packet.players[idx];

        Logger.log("PLAYER_HIT", {
            id: packet.id,
            type: packet.type,
            pos: [packet.posX, packet.posY],
            owner: packet.owner,
            player_id: player.id,
            player_health: player.health
        });
    }
}
function processPlayerFire(packet) {
    for (var idx in packet.projectiles) {
        const projectile = packet.projectiles[idx];

        Logger.log("PLAYER_FIRE", {
            id: packet.id,
            energy: packet.energy,
            proj_id: projectile.id,
            proj_type: projectile.type,
        });
    }
}
function processScoreBoard(packet) {
    let distance2 = function (a, b) {
        return (a[0] - b[0]) * (a[0] - b[0]) +
            (a[1] - b[1]) * (a[1] - b[1]);
    }

    var avgx = 0.0;
    var avgy = 0.0;

    for (var idx in packet.rankings) {
        var ranking = packet.rankings[idx];

        avgx += ranking.x;
        avgy += ranking.y;
    }

    avgx /= packet.rankings.length;
    avgy /= packet.rankings.length;

    var maxdist2 = 1e12;
    var nearestID = 0;
    for (var idx in packet.rankings) {
        var ranking = packet.rankings[idx];

        var dist2 = distance2([ranking.x, ranking.y], [0, 0]);

        if (dist2 < maxdist2) {
            maxdist2 = dist2;
            nearestID = ranking.id;
        }
    }

    client.send(encodeMessage({
        c: CLIENTPACKET.COMMAND,
        com: "spectate",
        data: "" + nearestID
    }))
}
function processServerCustom(packet) {
    obj = JSON.parse(packet.data);
    Logger.log("GAME_WIN", {
        team: e.w,
        bounty: e.b
    });
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

    Logger.log("ERROR", obj);
}
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
        73: "CHAT_WISPER",
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
function logPacket(packet) {
    switch (packet.c) {
        // Events pertaining to the current player only
        case SERVERPACKET.PLAYER_UPGRADE: // Current player is upgraded
        case SERVERPACKET.PLAYER_POWERUP:
        case SERVERPACKET.PING_RESULT:
        case SERVERPACKET.CHAT_TEAM: // Don't record team chat
        case SERVERPACKET.EVENT_BOOST:
        case SERVERPACKET.EVENT_BOUNCE:
        case SERVERPACKET.EVENT_REPEL:
        case SERVERPACKET.EVENT_STEALTH:
        case SERVERPACKET.MOB_DESPAWN:
        case SERVERPACKET.MOB_UPDATE:
        case SERVERPACKET.MOB_DESPAWN_COORDS:
        case SERVERPACKET.MOB_UPDATE_STATIONARY:
            break;

        case SERVERPACKET.GAME_SPECTATE:
            Logger.debug("SPECTATE", { id: packet.id });
            break;

        // Events that we might want to use in the future
        case SERVERPACKET.PLAYER_FIRE:
            processPlayerFire(packet);
            break;
        case SERVERPACKET.PLAYER_HIT:
            processPlayerHit(packet);
            break;

        case SERVERPACKET.LOGIN:
            processLogin(packet);
            break;
        case SERVERPACKET.PLAYER_UPDATE:
            processPlayerUpdate(packet);
            break;
        case SERVERPACKET.PLAYER_RESPAWN:
            processPlayerRespawn(packet);
            break;
        case SERVERPACKET.PLAYER_LEAVE:
            processPlayerLeave(packet);
            break;
        case SERVERPACKET.PLAYER_NEW:
            processPlayerNew(packet);
            break;
        case SERVERPACKET.PLAYER_RETEAM:
            processReteam(packet);
            break;
        case SERVERPACKET.GAME_FLAG:
            processGameFlag(packet);
            break;


        // TODO: Present this better
        // and use for far away positions?
        case SERVERPACKET.SCORE_BOARD:
            break;

        case SERVERPACKET.SCORE_DETAILED_CTF:
            processDetailedScore(packet);
            break;

        case SERVERPACKET.CHAT_WHISPER:
            processWhisper(packet);
            break;
        case SERVERPACKET.CHAT_PUBLIC:
            processChatPublic(packet);
            break;

        case SERVERPACKET.PLAYER_KILL:
            processPlayerKill(packet);
            break;
        case SERVERPACKET.PLAYER_TYPE:
            processPlayerType(packet);
            break;
        case SERVERPACKET.EVENT_LEAVEHORIZON:
            processLeaveHorizon(packet);

        case SERVERPACKET.SERVER_CUSTOM:
            break;

        default:
            packet.c = decodePacketType(packet.c);
            Logger.log("PACKET", packet);
            break;
    }
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
        // This might be different for a signed-in player
        // not sure what this does either
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

