'use strict';

const AirmashClient = require('./client');
const GameAssets = require('./gamecode');
const Logger = require('./logger');
const throttledQueue = require('./throttle');

const SERVERPACKET = GameAssets.serverPacket;
const CLIENTPACKET = GameAssets.clientPacket;
const PlayHost = GameAssets.playHost;
const PlayPath = GameAssets.playPath;

if (process.argv.length < 3) {
    process.exit(-1);
}

// Suppress PLAYER_UPDATE
Logger.active_info = true;
Logger.debug_info = true;

const OWNER = process.argv[2];
const MYNAME = process.argv[3];
const HELPTEXT = 'STATSBOT docs: https://steamroller.starma.sh/statsbot';

var client = new AirmashClient(
    'wss://game-' + PlayHost + '.airma.sh/' + PlayPath, true, {
        name: MYNAME,
        horizonX: (1 << 16) - 1,
        horizonY: (1 << 16) - 1
    });

var throttle = throttledQueue(4, 16 * 1000);

var flagCarrierRed = 0;
var flagCarrierBlue = 0;
var ownerID = 0;
var lowChat = true;
var requestInterval;

const BlueTeam = 2;
const RedTeam = 1;

function sendWhisper(msg, dest) {
    throttle(function () {
        client.send({
            c: CLIENTPACKET.WHISPER,
            id: dest,
            text: msg
        });
    });
}
function sendChat(msg) {
    throttle(function () {
        client.send({
            c: CLIENTPACKET.CHAT,
            text: msg
        });
    });
}

// Utility function for filtering players
function filter(players, fn) {
    let arr = [];
    for (var i in players) {
        if (fn(players[i])) {
            arr.push(players[i]);
        }
    }
    return arr;
}

function getGameTime() {
    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;

    var time = new Date() - client.gameStart;
    return '' + Math.floor(time / msPerHour) +
        ' hours, ' + (Math.floor(time / msPerMinute) % 60) +
        ' minutes, and ' + (Math.floor(time / 1000) % 60) +
        ' seconds have elapsed since this game started.';
}
function getGameTimeApi() {
    var time = new Date() - client.gameStart;
    return '' + time;
}
function getLastWin() {
    if (client.lastWinner === 1)
        return "The last game was won by blue team.";
    else if (client.lastWinner === 2)
        return "The last game was won by red team.";
    else
        return MYNAME + " has been restarted since this game " +
            "and does not know which team won the last game.";
}
function getGameTeams() {
    if (client.team == BlueTeam) {
        return "Blue team: " + (client.blueteam.size - 1) +
            " + STATSBOT, Red team: " + client.redteam.size;
    }
    else {
        return "Blue team: " + client.blueteam.size +
            ", Red team: " + (client.redteam.size - 1) +
            " + STATSBOT";
    }
}
function getGameTeamsNospec() {
    const specCutoff = 2;

    let bluecnt = filter(client.players, function (e) {
        return e.spec >= specCutoff && e.team == BlueTeam;
    }).length;
    let redcnt = filter(client.players, function (e) {
        return e.spec >= specCutoff && e.team == RedTeam;
    }).length;

    return "Blue team: " + (client.blueteam.size - bluecnt) +
        " (+" + bluecnt + " in spec), Red team: " +
        (client.redteam.size - redcnt) + " (+" + redcnt +
        " in spec)";
}

function processLogin(packet) {
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
function processPlayerFlag(packet) {
    Logger.log("PLAYER_FLAG", {
        id: packet.id,
        flag: packet.flag
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
}
function processDetailedScore(packet) {
    for (var idx in packet.scores) {
        var score = packet.scores[idx];

        Logger.log("PLAYER_DETAILED_SCORE", {
            id: score.id,
            level: score.level,
            captures: score.captures,
            score: score.score,
            kills: score.kills,
            deaths: score.deaths,
            damage: score.damage,
            ping: score.ping
        });
    }
}
function processWhisper(packet) {
    Logger.log("CHAT_WHISPER", {
        to: packet.to,
        from: packet.from,
        text: packet.text
    });

    if (packet.text.toUpperCase() === '-GAME-TIME') {
        sendWhisper(getGameTime(), packet.from);
    }
    else if (packet.text.toUpperCase() === "-ANON-ME") {
        Logger.log("ANONYMISE", { id: packet.from });

        let text = "You will now be anonymised from STATSBOT logs for this session.";
        sendWhisper(text, packet.from);
    }
    else if (packet.text.toUpperCase() === '-ANON-ME-QUIET' && !lowChat) {
        Logger.log("ANONYMISE", { id: packet.from });
    }
    else if (packet.text.toUpperCase() === '-LAST-WIN') {
        sendWhisper(getLastWin(), packet.from);
    }
    else if (packet.text.toUpperCase() === '-GAME-TEAMS') {
        sendWhisper(getGameTeams(), packet.from);
    }
    else if (packet.text.toUpperCase() === '-API-GAME-TIME') {
        sendWhisper(getGameTimeApi(), packet.from);
    }
    else if (packet.text.toUpperCase() === '-API-GAME-START') {
        sendWhisper('' + client.gameStart.getTime(), packet.from);
    }
    else if (packet.text.toUpperCase() === '-API-FIRSTGAME') {
        sendWhisper('' + client.firstgame, packet.from);
    }
    else if (packet.text.toUpperCase() === '-HELP' || packet.text.toUpperCase() === 'HELP') {
        sendWhisper(HELPTEXT, packet.from);
    }
    else if (packet.text.toUpperCase() === "-GAME-TEAMS-NOSPEC") {
        sendChat(getGameTeamsNospec(), packet.from);
    }
}
function processChatPublic(packet) {
    Logger.log("CHAT_PUBLIC", {
        id: packet.id,
        text: packet.text
    });

    if (packet.text.toUpperCase() === "-SWAM-PING") {
        sendWhisper("I'm using STARMASH, theme: " + MYNAME, packet.id);
    }
    else if (packet.text.toUpperCase() === "-BOT-PING") {
        sendWhisper("I am " + MYNAME + ", owner: " + OWNER, packet.id);
    }
    else if (packet.text.toUpperCase() === "-PROW-PING") {
        sendWhisper(
            "STATSBOT cannot find prowlers for you :(",
            packet.id);
    }
    else if (packet.text.toUpperCase() === '-GAME-TIME') {
        sendChat(getGameTime());
    }
    else if (packet.text.toUpperCase() === '-LAST-WIN') {
        sendChat(getLastWin());
    }
    else if (packet.text.toUpperCase() === '-GAME-TEAMS') {
        sendChat(getGameTeams());
    }
    else if (packet.text.toUpperCase() === '-STATSBOT-HELP') {
        sendChat(HELPTEXT);
    }
    else if (packet.text.toUpperCase() === "-GAME-TEAMS-NOSPEC") {
        sendChat(getGameTeamsNospec());
    }
}
function processPlayerRespawn(packet) {
    if (packet.id == client.id) {
        // Make statsbot spectate on new game   
        setTimeout(function () {
            client.send({
                c: CLIENTPACKET.COMMAND,
                com: "spectate",
                data: "-3"
            });
        }, 5 * 1000);
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
    };

    if (client.spectating) {
        let avgx = 0.0;
        let avgy = 0.0;

        for (let idx in packet.rankings) {
            let ranking = packet.rankings[idx];

            avgx += ranking.x;
            avgy += ranking.y;
        }

        avgx /= packet.rankings.length;
        avgy /= packet.rankings.length;

        let maxdist2 = 1e12;
        let nearestID = 0;
        for (let idx in packet.rankings) {
            let ranking = packet.rankings[idx];

            let dist2 = distance2([ranking.x, ranking.y], [0, 0]);

            if (dist2 < maxdist2 && dist2 != 0) {
                maxdist2 = dist2;
                nearestID = ranking.id;
            }

            Logger.log("PLAYER_UPDATE", {
                id: ranking.id,
                pos: [ranking.x, ranking.y]
            });
        }

        client.send({
            c: CLIENTPACKET.COMMAND,
            com: "spectate",
            data: "" + nearestID
        });
    }

    for (var idx in packet.data) {
        var player = packet.data[idx];

        Logger.log("SCORE_BOARD_DATA", {
            id: player.id,
            score: player.score,
            level: player.level
        });
    }
}
function processServerCustom(packet) {
    var obj = JSON.parse(packet.data);
    Logger.log("GAME_WIN", {
        team: obj.w,
        bounty: obj.b
    });

    setTimeout(function () {
        client.close();
    }, 5 * 1000);
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
        case SERVERPACKET.PLAYER_LEVEL:
            processPlayerLevel(packet);
            break;
        case SERVERPACKET.PLAYER_FLAG:
            processPlayerFlag(packet);
            break;
        case SERVERPACKET.GAME_FLAG:
            processGameFlag(packet);
            break;

        case SERVERPACKET.SCORE_BOARD:
            processScoreBoard(packet);
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
            break;

        case SERVERPACKET.SERVER_CUSTOM:
            processServerCustom(packet);
            break;

        default:
            packet.c = decodePacketType(packet.c);
            Logger.log("PACKET", packet);
            break;
    }
}

client.on('packet', function (t) {
    if (t.c == SERVERPACKET.ERROR) {
        logError(t);
    }
    else {
        logPacket(t);
    }
});
client.on('open', function () {
    // Make statsbot spectate on joining    
    setTimeout(function () {
        client.send({
            c: CLIENTPACKET.COMMAND,
            com: "spectate",
            data: "-3"
        });
    }, 1000);

    // Cancel our previous scoredetailed request loop
    if (!!requestInterval) {
        clearInterval(requestInterval);
    }

    // Request a score board every 5s
    requestInterval = setInterval(function () {
        client.send({
            c: CLIENTPACKET.SCOREDETAILED
        });
    }, 30 * 1000);
});
