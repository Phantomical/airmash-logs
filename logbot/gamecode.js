

const CLIENTPACKET = {
    LOGIN: 0,
    BACKUP: 1,
    HORIZON: 2,
    ACK: 5,
    PONG: 6,
    KEY: 10,
    COMMAND: 11,
    SCOREDETAILED: 12,
    CHAT: 20,
    WHISPER: 21,
    SAY: 22,
    TEAMCHAT: 23,
    VOTEMUTE: 24,
    LOCALPING: 255
};
const SERVERPACKET = {
    LOGIN: 0,
    BACKUP: 1,
    PING: 5,
    PING_RESULT: 6,
    ACK: 7,
    ERROR: 8,
    COMMAND_REPLY: 9,
    PLAYER_NEW: 10,
    PLAYER_LEAVE: 11,
    PLAYER_UPDATE: 12,
    PLAYER_FIRE: 13,
    PLAYER_HIT: 14,
    PLAYER_RESPAWN: 15,
    PLAYER_FLAG: 16,
    PLAYER_KILL: 17,
    PLAYER_UPGRADE: 18,
    PLAYER_TYPE: 19,
    PLAYER_POWERUP: 20,
    PLAYER_LEVEL: 21,
    PLAYER_RETEAM: 22,
    GAME_FLAG: 30,
    GAME_SPECTATE: 31,
    GAME_PLAYERSALIVE: 32,
    GAME_FIREWALL: 33,
    EVENT_REPEL: 40,
    EVENT_BOOST: 41,
    EVENT_BOUNCE: 42,
    EVENT_STEALTH: 43,
    EVENT_LEAVEHORIZON: 44,
    MOB_UPDATE: 60,
    MOB_UPDATE_STATIONARY: 61,
    MOB_DESPAWN: 62,
    MOB_DESPAWN_COORDS: 63,
    CHAT_PUBLIC: 70,
    CHAT_TEAM: 71,
    CHAT_SAY: 72,
    CHAT_WHISPER: 73,
    CHAT_VOTEMUTEPASSED: 78,
    CHAT_VOTEMUTED: 79,
    SCORE_UPDATE: 80,
    SCORE_BOARD: 81,
    SCORE_DETAILED: 82,
    SCORE_DETAILED_CTF: 83,
    SCORE_DETAILED_BTR: 84,
    SERVER_MESSAGE: 90,
    SERVER_CUSTOM: 91
};

const I = {
    text: 1,
    textbig: 2,
    array: 3,
    arraysmall: 4,
    uint8: 5,
    uint16: 6,
    uint24: 7,
    uint32: 8,
    float32: 9,
    float64: 10,
    boolean: 11,
    speed: 12,
    accel: 13,
    coordx: 14,
    coordy: 15,
    coord24: 16,
    rotation: 17,
    healthnergy: 18,
    regen: 19
};
const M = {
    [CLIENTPACKET.LOGIN]: [
        ['protocol', I.uint8],
        ['name', I.text],
        ['session', I.text],
        ['horizonX', I.uint16],
        ['horizonY', I.uint16],
        ['flag', I.text]
    ],
    [CLIENTPACKET.BACKUP]: [
        ['token', I.text]
    ],
    [CLIENTPACKET.HORIZON]: [
        ['horizonX', I.uint16],
        ['horizonY', I.uint16]
    ],
    [CLIENTPACKET.ACK]: [],
    [CLIENTPACKET.PONG]: [
        ['num', I.uint32]
    ],
    [CLIENTPACKET.KEY]: [
        ['seq', I.uint32],
        ['key', I.uint8],
        ['state', I.boolean]
    ],
    [CLIENTPACKET.COMMAND]: [
        ['com', I.text],
        ['data', I.text]
    ],
    [CLIENTPACKET.SCOREDETAILED]: [],
    [CLIENTPACKET.CHAT]: [
        ['text', I.text]
    ],
    [CLIENTPACKET.WHISPER]: [
        ['id', I.uint16],
        ['text', I.text]
    ],
    [CLIENTPACKET.SAY]: [
        ['text', I.text]
    ],
    [CLIENTPACKET.TEAMCHAT]: [
        ['text', I.text]
    ],
    [CLIENTPACKET.VOTEMUTE]: [
        ['id', I.uint16]
    ],
    [CLIENTPACKET.LOCALPING]: [
        ['auth', I.uint32]
    ]
};
const O = {
    [SERVERPACKET.LOGIN]: [
        ['success', I.boolean],
        ['id', I.uint16],
        ['team', I.uint16],
        ['clock', I.uint32],
        ['token', I.text],
        ['type', I.uint8],
        ['room', I.text],
        ['players', I.array, [
            ['id', I.uint16],
            ['status', I.uint8],
            ['level', I.uint8],
            ['name', I.text],
            ['type', I.uint8],
            ['team', I.uint16],
            ['posX', I.coordx],
            ['posY', I.coordy],
            ['rot', I.rotation],
            ['flag', I.uint16],
            ['upgrades', I.uint8]
        ]
        ]
    ],
    [SERVERPACKET.BACKUP]: [],
    [SERVERPACKET.PING]: [
        ['clock', I.uint32],
        ['num', I.uint32]
    ],
    [SERVERPACKET.PING_RESULT]: [
        ['ping', I.uint16],
        ['playerstotal', I.uint32],
        ['playersgame', I.uint32]
    ],
    [SERVERPACKET.ACK]: [],
    [SERVERPACKET.ERROR]: [
        ['error', I.uint8]
    ],
    [SERVERPACKET.COMMAND_REPLY]: [
        ['type', I.uint8],
        ['text', I.textbig]
    ],
    [SERVERPACKET.PLAYER_NEW]: [
        ['id', I.uint16],
        ['status', I.uint8],
        ['name', I.text],
        ['type', I.uint8],
        ['team', I.uint16],
        ['posX', I.coordx],
        ['posY', I.coordy],
        ['rot', I.rotation],
        ['flag', I.uint16],
        ['upgrades', I.uint8]
    ],
    [SERVERPACKET.PLAYER_LEAVE]: [
        ['id', I.uint16]
    ],
    [SERVERPACKET.PLAYER_UPDATE]: [
        ['clock', I.uint32],
        ['id', I.uint16],
        ['keystate', I.uint8],
        ['upgrades', I.uint8],
        ['posX', I.coord24],
        ['posY', I.coord24],
        ['rot', I.rotation],
        ['speedX', I.speed],
        ['speedY', I.speed]
    ],
    [SERVERPACKET.PLAYER_FIRE]: [
        ['clock', I.uint32],
        ['id', I.uint16],
        ['energy', I.healthnergy],
        ['energyRegen', I.regen],
        ['projectiles', I.arraysmall, [
            ['id', I.uint16],
            ['type', I.uint8],
            ['posX', I.coordx],
            ['posY', I.coordy],
            ['speedX', I.speed],
            ['speedY', I.speed],
            ['accelX', I.accel],
            ['accelY', I.accel],
            ['maxSpeed', I.speed]
        ]
        ]
    ],
    [SERVERPACKET.PLAYER_SAY]: [
        ['id', I.uint16],
        ['text', I.text]
    ],
    [SERVERPACKET.PLAYER_RESPAWN]: [
        ['id', I.uint16],
        ['posX', I.coord24],
        ['posY', I.coord24],
        ['rot', I.rotation],
        ['upgrades', I.uint8]
    ],
    [SERVERPACKET.PLAYER_FLAG]: [
        ['id', I.uint16],
        ['flag', I.uint16]
    ],
    [SERVERPACKET.PLAYER_HIT]: [
        ['id', I.uint16],
        ['type', I.uint8],
        ['posX', I.coordx],
        ['posY', I.coordy],
        ['owner', I.uint16],
        ['players', I.arraysmall, [
            ['id', I.uint16],
            ['health', I.healthnergy],
            ['healthRegen', I.regen]
        ]
        ]
    ],
    [SERVERPACKET.PLAYER_KILL]: [
        ['id', I.uint16],
        ['killer', I.uint16],
        ['posX', I.coordx],
        ['posY', I.coordy]
    ],
    [SERVERPACKET.PLAYER_UPGRADE]: [
        ['upgrades', I.uint16],
        ['type', I.uint8],
        ['speed', I.uint8],
        ['defense', I.uint8],
        ['energy', I.uint8],
        ['missile', I.uint8]
    ],
    [SERVERPACKET.PLAYER_TYPE]: [
        ['id', I.uint16],
        ['type', I.uint8]
    ],
    [SERVERPACKET.PLAYER_POWERUP]: [
        ['type', I.uint8],
        ['duration', I.uint32]
    ],
    [SERVERPACKET.PLAYER_LEVEL]: [
        ['id', I.uint16],
        ['type', I.uint8],
        ['level', I.uint8]
    ],
    [SERVERPACKET.PLAYER_RETEAM]: [
        ['players',
            I.array, [
                ['id', I.uint16],
                ['team', I.uint16]
            ]
        ]
    ],
    [SERVERPACKET.GAME_FLAG]: [
        ['type', I.uint8],
        ['flag', I.uint8],
        ['id', I.uint16],
        ['posX', I.coord24],
        ['posY', I.coord24],
        ['blueteam', I.uint8],
        ['redteam', I.uint8]
    ],
    [SERVERPACKET.GAME_SPECTATE]: [
        ['id', I.uint16]
    ],
    [SERVERPACKET.GAME_PLAYERSALIVE]: [
        ['players', I.uint16]
    ],
    [SERVERPACKET.GAME_FIREWALL]: [
        ['type', I.uint8],
        ['status', I.uint8],
        ['posX', I.coordx],
        ['posY', I.coordy],
        ['radius', I.float32],
        ['speed', I.float32]
    ],
    [SERVERPACKET.EVENT_REPEL]: [
        ['clock', I.uint32],
        ['id', I.uint16],
        ['posX', I.coordx],
        ['posY', I.coordy],
        ['rot', I.rotation],
        ['speedX', I.speed],
        ['speedY', I.speed],
        ['energy', I.healthnergy],
        ['energyRegen', I.regen],
        [
            'players',
            I.arraysmall, [
                ['id', I.uint16],
                ['keystate', I.uint8],
                ['posX', I.coordx],
                ['posY', I.coordy],
                ['rot', I.rotation],
                ['speedX', I.speed],
                ['speedY', I.speed],
                ['energy', I.healthnergy],
                ['energyRegen', I.regen],
                ['playerHealth', I.healthnergy],
                ['playerHealthRegen', I.regen]
            ]
        ],
        [
            'mobs',
            I.arraysmall, [
                ['id', I.uint16],
                ['type', I.uint8],
                ['posX', I.coordx],
                ['posY', I.coordy],
                ['speedX', I.speed],
                ['speedY', I.speed],
                ['accelX', I.accel],
                ['accelY', I.accel],
                ['maxSpeed', I.speed]
            ]
        ]
    ],
    [SERVERPACKET.EVENT_BOOST]: [
        ['clock', I.uint32],
        ['id', I.uint16],
        ['boost', I.boolean],
        ['posX', I.coord24],
        ['posY', I.coord24],
        ['rot', I.rotation],
        ['speedX', I.speed],
        ['speedY', I.speed],
        ['energy', I.healthnergy],
        ['energyRegen', I.regen]
    ],
    [SERVERPACKET.EVENT_BOUNCE]: [
        ['clock', I.uint32],
        ['id', I.uint16],
        ['keystate', I.uint8],
        ['posX', I.coord24],
        ['posY', I.coord24],
        ['rot', I.rotation],
        ['speedX', I.speed],
        ['speedY', I.speed]
    ],
    [SERVERPACKET.EVENT_STEALTH]: [
        ['id', I.uint16],
        ['state', I.boolean],
        ['energy', I.healthnergy],
        ['energyRegen', I.regen]
    ],
    [SERVERPACKET.EVENT_LEAVEHORIZON]: [
        ['type', I.uint8],
        ['id', I.uint16]
    ],
    [SERVERPACKET.MOB_UPDATE]: [
        ['clock', I.uint32],
        ['id', I.uint16],
        ['type', I.uint8],
        ['posX', I.coordx],
        ['posY', I.coordy],
        ['speedX', I.speed],
        ['speedY', I.speed],
        ['accelX', I.accel],
        ['accelY', I.accel],
        ['maxSpeed', I.speed]
    ],
    [SERVERPACKET.MOB_UPDATE_STATIONARY]: [
        ['id', I.uint16],
        ['type', I.uint8],
        ['posX', I.float32],
        ['posY', I.float32]
    ],
    [SERVERPACKET.MOB_DESPAWN]: [
        ['id', I.uint16],
        ['type', I.uint8]
    ],
    [SERVERPACKET.MOB_DESPAWN_COORDS]: [
        ['id', I.uint16],
        ['type', I.uint8],
        ['posX', I.coordx],
        ['posY', I.coordy]
    ],
    [SERVERPACKET.SCORE_UPDATE]: [
        ['id', I.uint16],
        ['score', I.uint32],
        ['earnings', I.uint32],
        ['upgrades', I.uint16],
        ['totalkills', I.uint32],
        ['totaldeaths', I.uint32]
    ],
    [SERVERPACKET.SCORE_BOARD]: [
        ['data', I.array, [
            ['id', I.uint16],
            ['score', I.uint32],
            ['level', I.uint8]
        ]
        ],
        ['rankings', I.array, [
            ['id', I.uint16],
            ['x', I.uint8],
            ['y', I.uint8]
        ]
        ]
    ],
    [SERVERPACKET.SCORE_DETAILED]: [
        ['scores', I.array, [
            ['id', I.uint16],
            ['level', I.uint8],
            ['score', I.uint32],
            ['kills', I.uint16],
            ['deaths', I.uint16],
            ['damage', I.float32],
            ['ping', I.uint16]
        ]
        ]
    ],
    [SERVERPACKET.SCORE_DETAILED_CTF]: [
        ['scores', I.array, [
            ['id', I.uint16],
            ['level', I.uint8],
            ['captures', I.uint16],
            ['score', I.uint32],
            ['kills', I.uint16],
            ['deaths', I.uint16],
            ['damage', I.float32],
            ['ping', I.uint16]
        ]
        ]
    ],
    [SERVERPACKET.SCORE_DETAILED_BTR]: [
        ['scores', I.array, [
            ['id', I.uint16],
            ['level', I.uint8],
            ['alive', I.boolean],
            ['wins', I.uint16],
            ['score', I.uint32],
            ['kills', I.uint16],
            ['deaths', I.uint16],
            ['damage', I.float32],
            ['ping', I.uint16]
        ]
        ]
    ],
    [SERVERPACKET.CHAT_TEAM]: [
        ['id', I.uint16],
        ['text', I.text]
    ],
    [SERVERPACKET.CHAT_PUBLIC]: [
        ['id', I.uint16],
        ['text', I.text]
    ],
    [SERVERPACKET.CHAT_SAY]: [
        ['id', I.uint16],
        ['text', I.text]
    ],
    [SERVERPACKET.CHAT_WHISPER]: [
        ['from', I.uint16],
        ['to', I.uint16],
        ['text', I.text]
    ],
    [SERVERPACKET.CHAT_VOTEMUTEPASSED]: [
        ['id', I.uint16]
    ],
    [SERVERPACKET.CHAT_VOTEMUTED]: [],
    [SERVERPACKET.SERVER_MESSAGE]: [
        ['type', I.uint8],
        ['duration', I.uint32],
        ['text', I.textbig]
    ],
    [SERVERPACKET.SERVER_CUSTOM]: [
        ['type', I.uint8],
        ['data', I.textbig]
    ]
};

var Tools = {};
Tools.decodeCoordY = function (e) {
    return (e - 32768) / 4
};
Tools.decodeCoordX = function (e) {
    return (e - 32768) / 2
};
Tools.decodeRotation = function (e) {
    return e / 6553.6
};
Tools.decodeCoord24 = function (e) {
    return (e - 8388608) / 512
};
Tools.decodeSpeed = function (e) {
    return (e - 32768) / 1638.4
};
Tools.decodeHealthnergy = function (e) {
    return e / 255
};
Tools.decodeRegen = function (e) {
    return (e - 32768) / 1e6
};
Tools.decodeAccel = function (e) {
    return (e - 32768) / 32768
};
Tools.encodeUTF8 = function (e) {
    for (var t = 0, n = new Uint8Array(4 * e.length), r = 0; r != e.length; r++) {
        var i = e.charCodeAt(r);
        if (i < 128) n[t++] = i;
        else {
            if (i < 2048) n[t++] = i >> 6 | 192;
            else {
                if (i > 55295 && i < 56320) {
                    if (++r == e.length) throw 'UTF-8 encode: incomplete surrogate pair';
                    var o = e.charCodeAt(r);
                    if (o < 56320 || o > 57343) throw 'UTF-8 encode: second char code 0x' + o.toString(16) + ' at index ' + r + ' in surrogate pair out of range';
                    i = 65536 + ((1023 & i) << 10) + (1023 & o),
                        n[t++] = i >> 18 | 240,
                        n[t++] = i >> 12 & 63 | 128
                } else n[t++] = i >> 12 | 224;
                n[t++] = i >> 6 & 63 | 128
            }
            n[t++] = 63 & i | 128
        }
    }
    return n.subarray(0, t)
};
Tools.decodeUTF8 = function (e) {
    for (var t = '', n = 0; n < e.length;) {
        var r = e[n++];
        if (r > 127) {
            if (r > 191 && r < 224) {
                if (n >= e.length) throw 'UTF-8 decode: incomplete 2-byte sequence';
                r = (31 & r) << 6 | 63 & e[n]
            } else if (r > 223 && r < 240) {
                if (n + 1 >= e.length) throw 'UTF-8 decode: incomplete 3-byte sequence';
                r = (15 & r) << 12 | (63 & e[n]) << 6 | 63 & e[++n]
            } else {
                if (!(r > 239 && r < 248)) throw 'UTF-8 decode: unknown multibyte start 0x' + r.toString(16) + ' at index ' + (n - 1);
                if (n + 2 >= e.length) throw 'UTF-8 decode: incomplete 4-byte sequence';
                r = (7 & r) << 18 | (63 & e[n]) << 12 | (63 & e[++n]) << 6 | 63 & e[++n]
            }
            ++n
        }
        if (r <= 65535) t += String.fromCharCode(r);
        else {
            if (!(r <= 1114111)) throw 'UTF-8 decode: code point 0x' + r.toString(16) + ' exceeds UTF-16 reach';
            r -= 65536,
                t += String.fromCharCode(r >> 10 | 55296),
                t += String.fromCharCode(1023 & r | 56320)
        }
    }
    return t
};

let decodeMessage = function (e, t) {
    var n = new DataView(e),
        r = {
            c: n.getUint8(0, !0)
        },
        i = 1,
        o = O[r.c];
    if (null == o) return null;
    for (var s = 0; s < o.length; s++) {
        var a = o[s][0];
        switch (o[s][1]) {
            case I.text:
            case I.textbig:
                if (o[s][1] == I.text) {
                    var l = n.getUint8(i, !0);
                    i += 1
                } else {
                    l = n.getUint16(i, !0);
                    i += 2
                }
                for (var u = new Uint8Array(l), c = 0; c < l; c++) u[c] = n.getUint8(i + c, !0);
                var h = Tools.decodeUTF8(u);
                r[a] = h,
                    i += l;
                break;
            case I.array:
            case I.arraysmall:
                if (o[s][1] == I.arraysmall) {
                    var d = n.getUint8(i, !0);
                    i += 1
                } else {
                    d = n.getUint16(i, !0);
                    i += 2
                }
                r[a] = [
                ];
                for (var p = o[s][2], f = 0; f < d; f++) {
                    for (var g = {
                    }, m = 0; m < p.length; m++) {
                        var v = p[m][0];
                        switch (p[m][1]) {
                            case I.text:
                            case I.textbig:
                                if (p[m][1] == I.text) {
                                    l = n.getUint8(i, !0);
                                    i += 1
                                } else {
                                    l = n.getUint16(i, !0);
                                    i += 2
                                }
                                for (u = new Uint8Array(l), c = 0; c < l; c++) u[c] = n.getUint8(i + c, !0);
                                h = Tools.decodeUTF8(u);
                                g[v] = h,
                                    i += l;
                                break;
                            case I.uint8:
                                g[v] = n.getUint8(i, !0),
                                    i += 1;
                                break;
                            case I.uint16:
                                g[v] = n.getUint16(i, !0),
                                    i += 2;
                                break;
                            case I.uint24:
                                var y = 256 * n.getUint16(i, !0);
                                i += 2,
                                    r[v] = y + n.getUint8(i, !0),
                                    i += 1;
                                break;
                            case I.uint32:
                                g[v] = n.getUint32(i, !0),
                                    i += 4;
                                break;
                            case I.float32:
                                g[v] = n.getFloat32(i, !0),
                                    i += 4;
                                break;
                            case I.float64:
                                g[v] = n.getFloat64(i, !0),
                                    i += 8;
                                break;
                            case I.boolean:
                                g[v] = 0 != n.getUint8(i, !0),
                                    i += 1;
                                break;
                            case I.speed:
                                g[v] = Tools.decodeSpeed(n.getUint16(i, !0)),
                                    i += 2;
                                break;
                            case I.accel:
                                g[v] = Tools.decodeAccel(n.getUint16(i, !0)),
                                    i += 2;
                                break;
                            case I.coordx:
                                g[v] = Tools.decodeCoordX(n.getUint16(i, !0)),
                                    i += 2;
                                break;
                            case I.coordy:
                                g[v] = Tools.decodeCoordY(n.getUint16(i, !0)),
                                    i += 2;
                                break;
                            case I.coord24:
                                y = 256 * n.getUint16(i, !0);
                                i += 2,
                                    r[v] = Tools.decodeCoord24(y + n.getUint8(i, !0)),
                                    i += 1;
                                break;
                            case I.rotation:
                                g[v] = Tools.decodeRotation(n.getUint16(i, !0)),
                                    i += 2;
                                break;
                            case I.regen:
                                g[v] = Tools.decodeRegen(n.getUint16(i, !0)),
                                    i += 2;
                                break;
                            case I.healthnergy:
                                g[v] = Tools.decodeHealthnergy(n.getUint8(i, !0)),
                                    i += 1
                        }
                    }
                    r[a].push(g)
                }
                break;
            case I.uint8:
                r[a] = n.getUint8(i, !0),
                    i += 1;
                break;
            case I.uint16:
                r[a] = n.getUint16(i, !0),
                    i += 2;
                break;
            case I.uint24:
                y = 256 * n.getUint16(i, !0);
                i += 2,
                    r[a] = y + n.getUint8(i, !0),
                    i += 1;
                break;
            case I.uint32:
                r[a] = n.getUint32(i, !0),
                    i += 4;
                break;
            case I.float32:
                r[a] = n.getFloat32(i, !0),
                    i += 4;
                break;
            case I.float64:
                r[a] = n.getFloat64(i, !0),
                    i += 8;
                break;
            case I.boolean:
                r[a] = 0 != n.getUint8(i, !0),
                    i += 1;
                break;
            case I.speed:
                r[a] = Tools.decodeSpeed(n.getUint16(i, !0)),
                    i += 2;
                break;
            case I.accel:
                r[a] = Tools.decodeAccel(n.getUint16(i, !0)),
                    i += 2;
                break;
            case I.coordx:
                r[a] = Tools.decodeCoordX(n.getUint16(i, !0)),
                    i += 2;
                break;
            case I.coordy:
                r[a] = Tools.decodeCoordY(n.getUint16(i, !0)),
                    i += 2;
                break;
            case I.coord24:
                y = 256 * n.getUint16(i, !0);
                i += 2,
                    r[a] = Tools.decodeCoord24(y + n.getUint8(i, !0)),
                    i += 1;
                break;
            case I.rotation:
                r[a] = Tools.decodeRotation(n.getUint16(i, !0)),
                    i += 2;
                break;
            case I.regen:
                r[a] = Tools.decodeRegen(n.getUint16(i, !0)),
                    i += 2;
                break;
            case I.healthnergy:
                r[a] = Tools.decodeHealthnergy(n.getUint8(i, !0)),
                    i += 1;
                break;
            default:
                return null
        }
    }
    return r
};
let encodeMessage = function (e, t) {
    var n,
        r = 1,
        i = [
        ],
        o = M[e.c];
    if (null == o) return null;
    for (n = 0; n < o.length; n++) switch (o[n][1]) {
        case I.text:
            var s = Tools.encodeUTF8(e[o[n][0]]);
            i.push(s),
                r += 1 + s.length;
            break;
        case I.array:
        case I.arraysmall:
            break;
        case I.uint8:
            r += 1;
            break;
        case I.uint16:
            r += 2;
            break;
        case I.uint32:
        case I.float32:
            r += 4;
            break;
        case I.float64:
            r += 8;
            break;
        case I.boolean:
            r += 1
    }
    var a = new ArrayBuffer(r),
        l = new DataView(a),
        u = 0,
        c = 1;
    for (l.setUint8(0, e.c, !0), n = 0; n < o.length; n++) switch (o[n][1]) {
        case I.text:
            var h = i[u].length;
            l.setUint8(c, h, !0),
                c += 1;
            for (var d = 0; d < h; d++) l.setUint8(c + d, i[u][d], !0);
            i[u],
                u++ ,
                c += h;
            break;
        case I.array:
        case I.arraysmall:
            break;
        case I.uint8:
            l.setUint8(c, e[o[n][0]], !0),
                c += 1;
            break;
        case I.uint16:
            l.setUint16(c, e[o[n][0]], !0),
                c += 2;
            break;
        case I.uint32:
            l.setUint32(c, e[o[n][0]], !0),
                c += 4;
            break;
        case I.float32:
            l.setFloat32(c, e[o[n][0]], !0),
                c += 4;
            break;
        case I.float64:
            l.setFloat64(c, e[o[n][0]], !0),
                c += 8;
            break;
        case I.boolean:
            l.setUint8(c, !1 === e[o[n][0]] ? 0 : 1),
                c += 1
    }
    return a
};

module.exports = {
    playHost:      "us-s1",
    playPath:      "ctf1",
    clientPacket:  CLIENTPACKET,
    serverPacket:  SERVERPACKET,
    decodeMessage: decodeMessage,
    encodeMessage: encodeMessage
};
