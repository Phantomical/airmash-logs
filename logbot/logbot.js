'use strict';

const WebSocket = require('ws');
const GameAssets = require('./gamecode');

//console.log = () => {}

const SERVERPACKET = GameAssets.serverPacket;
const CLIENTPACKET = GameAssets.clientPacket;
const encodeMessage = GameAssets.encodeMessage;
const decodeMessage = GameAssets.decodeMessage;
const PlayHost = GameAssets.playHost;
const PlayPath = GameAssets.playPath;

const OWNER = "STEAMROLLER";
const MYNAME = "LOGBOT";

const URLS = [
    'wss://game-us-s1.airma.sh/ctf1',
    'ws://localhost:3501',
    'wss://dev.airmash.steamroller.tk',
    'wss://game-' + PlayHost + '.airma.sh/' + PlayPath
];

const URL = URLS[1];

var client = new WebSocket(URL);
client.binaryType = 'arraybuffer';

var selfID = 0;
var flagCarrierRed = 0;
var flagCarrierBlue = 0;
var ownerID = 0;

function getDateTime() {

    var date = new Date();

    var millisec = date.getMilliseconds();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec + ":" + millisec;

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
function processPlayerRespawn(packet) {
    if (packet.id === selfID) {
        return;
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
function processChatWhisper(packet) {
    // Apparently packet.from is the current player 
    if (packet.to === ownerID) {
        if (packet.text === ':restart') {
            process.exit(2);
        }
        else if (packet.text === ':shutdown') {
            process.exit(1);
        }
    }

    if (packet.text === ':specme') {
        client.send(encodeMessage({
            c: CLIENTPACKET.COMMAND,
            com: "spectate",
            data: "" + packet.from
        }));
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

    console.log("ERROR", JSON.stringify(obj));
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
    if (packet.c === SERVERPACKET.LOGIN) {
        selfID = packet.id;
    }
    else if (packet.c === SERVERPACKET.PLAYER_NEW) {
        if (packet.name === OWNER) {
            ownerID = packet.id;
        }
    }
    else if (packet.c === SERVERPACKET.PLAYER_LEAVE) {
        if (packet.id === ownerID) {
            ownerID = 0;
        }
    }
    else if (packet.c === SERVERPACKET.CHAT_PUBLIC) {
        processChatPublic(packet);
    }
    else if (packet.c === SERVERPACKET.PLAYER_RESPAWN) {
        processPlayerRespawn(packet);
    }
    else if (packet.c === SERVERPACKET.CHAT_WHISPER) {
        processChatWhisper(packet);
    }

    switch (packet.c) {
        default:
            packet.c = decodePacketType(packet.c);
            packet.time = getDateTime();
            console.log(JSON.stringify(packet));
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
        // Login token for a signed-in player
        session: 'none',
        // Expand view range of bot
        horizonX: (1 << 16) - 1,
        horizonY: (1 << 16) - 1,
        flag: 'eu'
    }));
    
    setTimeout(function () {
        client.send(encodeMessage({
            c: CLIENTPACKET.COMMAND,
            com: "respawn",
            data: "3"
        }));
    }, 3000);

    return;

    // Make statsbot spectate on joining    
    setTimeout(function () {
        client.send(encodeMessage({
            c: CLIENTPACKET.COMMAND,
            com: "spectate",
            data: "-3"
        }));
    }, 3000);
};
const onclose = function () {
    client = new WebSocket(URL);
    client.binaryType = 'arraybuffer';

    client.on('close', onclose);
    client.on('open', onopen);
    client.on('message', onmessage);
}

client.on('open', onopen);
client.on('message', onmessage);
client.on('close', onclose);

