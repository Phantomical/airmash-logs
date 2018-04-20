
import { encodeMessage, decodeMessage } from "./gamecode";
import { Player, GameInfo, Team, Type } from "./gameinfo";
import { Client, Server } from "./packet";

import { Event } from "typescript.events";

export class AirmashClient {
    // Websocket and WSBuilder
    wsfun: (url: string) => WebSocket
    ws: WebSocket
    serverURL: string

    emitter: Event

    // Bot Info
    loginPacket: Client.Login

    // Game Info
    gameInfo: GameInfo

    // Options
    restartOnDc: boolean
    decode: boolean

    // Current Bot State
    connected: boolean
    spectating: boolean
    id: number
    team: Team

    constructor(serverURL: string, botInfo: any, options: any) {
        // Setup websocket stuff
        if (!options.wsfun) {
            this.wsfun = function (url: string) {
                let ws = new WebSocket(url);
                ws.binaryType = 'arraybuffer';
                return ws;
            }
        }
        else {
            this.wsfun = options.wsfun;
        }

        this.ws = this.wsfun(serverURL);
        this.serverURL = serverURL;

        // Event Handling
        this.emitter = new Event();

        // Bot Info Setup
        this.loginPacket = {
            // Current server protocol version, must be 5
            protocol: 5,
            // Bot name
            name: !!botInfo.name ? botInfo.name as string : "UNNAMED BOT",
            // Login session for a signed-in player
            session: !!botInfo.session ? botInfo.session as string : 'none',
            // View range of bot (approximately)
            horizonX: !!botInfo.horizonX ? botInfo.horizonX as number : 1000,
            horizonY: !!botInfo.horizonY ? botInfo.horizonY as number : 1000,
            // Flag of Bot, default is UN flag
            flag: !!botInfo.flag ? botInfo.flag : 'XX'
        };

        // Options Setup
        this.restartOnDc = !!options.restartOnDc ? options.restartOnDc as boolean : false;
        this.decode = !!options.decode ? options.decode as boolean : true;

        // Game State and Bot State Setup
        this.gameInfo = new GameInfo();

        this.connected = false;
        this.spectating = false;
        this.id = 0;
        this.team = Team.Unknown;

        // Register ws callbacks
        this.ws.onopen = this._onopen.bind(this);
        this.ws.onclose = this._onclose.bind(this);
        this.ws.onmessage = this._onmessage.bind(this);

        // Register our own emitter events
        this._registerEvents();
    }

    on(type: string, fn: (obj:any) => void) {
        this.emitter.on(type, fn);
    }
    send(packet: any) {
        if (!this.connected) return;

        if (this.decode) {
            this.ws.send(encodeMessage(packet));
        }
        else {
            this.ws.send(packet);
        }
    }

    _onopen() {
        this.send(Client.Login.ToPacket(this.loginPacket));

        this.emitter.emit("open");
    }
    _onmessage(msg: any) {
        var packet = this.decode ? decodeMessage(msg) : msg;

        if (packet.c === Server.Packet.Ping as number) {
            this.send(Client.Pong.ToPacket({
                num: packet.num as number
            }));
        }
        else {
            this.emitter.emit('message', packet);
            this.emitter.emit(Server.DecodePacketType(packet.c as number), packet);
        }
    }
    _onclose(msg: any, code: any, reason: any) {
        this.connected = false;

        if (this.restartOnDc) {
            this.ws = this.wsfun(this.serverURL);

            this.ws.onopen = this._onopen.bind(this);
            this.ws.onclose = this._onclose.bind(this);
            this.ws.onmessage = this._onmessage.bind(this);
        }

        this.emitter.emit('close', msg, code, reason);
    }

    _registerEvents() {
        this.emitter.on("LOGIN", this._handleLogin.bind(this));
        this.emitter.on("PLAYER_NEW", this._handlePlayerNew.bind(this));
        this.emitter.on("PLAYER_LEVAE", this._handlePlayerLeave.bind(this));
        this.emitter.on("PLAYER_RETEAM", this._handlePlayerReteam.bind(this));
        this.emitter.on("PLAYER_LEVEL", this._handlePlayerLevel.bind(this));
        this.emitter.on("PLAYER_FLAG", this._handlePlayerFlag.bind(this));
        this.emitter.on("PLAYER_RESPWAN", this._handlePlayerRespawn.bind(this));
        this.emitter.on("GAME_SPECTATE", this._handleGameSpectate.bind(this));
        this.emitter.on("SERVER_CUSTOM", this._handleServerCustom.bind(this));
    }

    _handleLogin(packet: any) {
        this.spectating = false;
        this.id = packet.id as number;
        this.team = packet.team as Team;

        this.gameInfo.resetTeams();

        for (let i in packet.players) {
            let player = packet.players[i];

            this.gameInfo.playerNew({
                name: player.name as string,
                level: player.level as number,
                type: player.type as Type,
                team: player.team as Team,
                flag: player.flag as number,
                id: player.id as number
            });
        }
    }
    _handlePlayerNew(packet: any) {
        this.gameInfo.playerNew({
            name: packet.name as string,
            level: packet.level as number,
            type: packet.type as Type,
            team: packet.team as Team,
            flag: packet.flag as number,
            id: packet.id as number
        });
    }
    _handlePlayerLeave(packet: any) {
        this.gameInfo.playerLeave(packet.id as number);
    }
    _handlePlayerReteam(packet: any) {
        this.spectating = false;

        for (let i in packet.players) {
            let player = packet.players[i];

            this.gameInfo.playerReteam(
                player.id as number,
                player.team as Team);
        }
    }
    _handlePlayerLevel(packet: any) {
        this.gameInfo.playerLevel(
            packet.id as number,
            packet.level as number);
    }
    _handlePlayerFlag(packet: any) {
        this.gameInfo.playerFlag(
            packet.id as number,
            packet.flag as number);
    }
    _handlePlayerRespawn(packet: any) {
        if ((packet.id as number) === this.id) {
            this.spectating = false;
        }
    }
    _handleGameSpectate(packet: any) {
        this.spectating = true;
    }
    _handleServerCustom(packet: any) {
        this.gameInfo.gameWin(JSON.parse(packet.data).w as Team);
    }
}
