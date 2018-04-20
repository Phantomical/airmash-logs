import { Type, Team } from "./gameinfo";

/* Note: 
 *  These will be implemented on an as-needed basis
 */

export namespace Client {
    export enum Packet {
        Login = 0,
        Backup = 1,
        Horizon = 2,
        Ack = 5,
        Pong = 6,
        Key = 7,
        Command = 8,
        ScoreDetailed = 9,
        Chat = 20,
        Whisper = 21,
        Say = 22,
        TeamChat = 23
    }

    export class Login {
        protocol: number
        name: string
        session: string
        horizonX: number
        horizonY: number
        flag: string
        
        static ToPacket(obj: Login): object {
            return {
                c: Packet.Login as number,
                protocol: obj.protocol,
                name:     obj.name,
                session:  obj.session,
                horizonX: obj.horizonX,
                horizonY: obj.horizonY,
                flag:     obj.flag
            };
        }
    }

    export class Pong {
        num: number

        static ToPacket(obj: Pong): object {
            return {
                c: Packet.Pong as number,
                num: obj.num
            };
        }
    }

    export class Command {
        com: string
        data: string

        static ToPacket(obj: Command) {
            return {
                c: Packet.Command as number,
                com: obj.com,
                data: obj.data
            };
        }
    }

    export class ScoreDetailed { }

    export class Chat {
        text: string

        static ToPacket(obj: Chat) {
            return {
                c: Packet.Chat as number,
                text: obj.text
            };
        }
    }

    export class Whisper {
        id: number
        text: string

        static ToPacket(obj: Whisper) {
            return {
                c: Packet.Chat as number,
                id:   obj.id,
                text: obj.text
            };
        }
    }
}

export namespace Server {
    export enum Packet {
        Login = 0,
        Backup = 1,
        Ping = 5,
        PingResult = 6,
        Ack = 7,
        Error = 8,
        CommandReply = 9,
        PlayerNew = 10,
        PlayerLeave = 11,
        PlayerUpdate = 12,
        PlayerFire = 13,
        PlayerHit = 14,
        PlayerRespawn = 15,
        PlayerFlag = 16,
        PlayerKill = 17,
        PlayerUpgrade = 18,
        PlayerType = 19,
        PlayerPowerup = 20,
        PlayerLevel = 21,
        PlayerReteam = 22,
        GameFlag = 30,
        GameSpectate = 31,
        GamePlayersAlive = 32,
        GameFirewall = 33,
        EventRepel = 40,
        EventBoost = 41,
        EventBounce = 42,
        EventStealth = 43,
        EventLeaveHorizon = 44,
        MobUpdate = 60,
        MobUpdateStationary = 61,
        MobDespawn = 62,
        MobDespawnCoords = 63,
        ChatPublic = 70,
        ChatTeam = 71,
        ChatSay = 72,
        ChatWhisper = 73,
        ChatVoteMutePassed = 78,
        ScoreUpdate = 80,
        ScoreBoard = 81,
        ScoreDetailed = 82,
        ScoreDetailedCTF = 83,
        ScoreDetailedBTR = 84,
        ServerMessage = 90,
        ServerCustom = 91
    }

    export class LoginPlayer {
        id: number
        status: number
        level: number
        name: string
        type: Type
        team: Team
        posX: number
        posY: number
        rot: number
        flag: number
        upgrades: number
    }

    export class Login {
        success: boolean
        id: number
        team: Team
        clock: number
        token: string
        type: Type
        room: number
        players: LoginPlayer[]
    }

    export class Ping {
        clock: number
        num: number
    }

    export class PlayerNew {
        id: number
        status: number
        name: string
        type: Type
        team: Team
        posX: number
        posY: number
        rot: number
        flag: number
        upgrades: number
    }

    export class PlayerLeave {
        id: number
    }


    export function DecodePacketType(type: number): string {
        const packetTypes: any = {
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

        return packetTypes[type] as string;
    }
}
