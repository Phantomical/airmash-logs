
import { AirmashClient } from './client';
import { Logger } from './logger';
import { createThrottle } from './throttle';
import { CommandHandler } from './commands';
import { Client } from './packet';
import { Team } from './gameinfo';

import { Event } from 'typescript.events';

const HELPTEXT = 'STATSBOT docs: https://steamroller.starma.sh/statsbot';

export class StatsBot {
    owner: string
    myname: string
    ownerID: number

    client: AirmashClient

    public: CommandHandler
    whisper: CommandHandler
    throttle: (x: () => void) => void

    carriers: number[]

    constructor(
        owner: string,
        name: string,
        defaultHandlers: boolean = true) {
        this.carriers = [0, 0]
        this.owner = owner;
        this.myname = name;

        this.ownerID = 0;

        this.public = new CommandHandler();
        this.whisper = new CommandHandler();

        this.throttle = createThrottle(15 * 1000, 8, 20);
    }

    sendChat(msg: string) {
        this.throttle(function () {
            this.client.send(Client.Chat.ToPacket({
                text: msg
            }));
        }.bind(this));
    }
    sendWhisper(msg: string, id: number) {
        this.throttle(function () {
            this.client.send(Client.Whisper.ToPacket({
                id: id,
                text: msg
            }))
        })
    }

    getGameTime() {
        var msPerMinute = 60 * 1000;
        var msPerHour = msPerMinute * 60;

        var time = new Date().getTime() - this.client.gameInfo.gameStart.getTime();
        return '' + Math.floor(time / msPerHour) +
            ' hours, ' + (Math.floor(time / msPerMinute) % 60) +
            ' minutes, and ' + (Math.floor(time / 1000) % 60) +
            ' seconds have elapsed since this game started.';
    }
    getLastWin() {
        if (this.client.gameInfo.lastWin === Team.BlueTeam)
            return "The last game was won by blue team.";
        else if (this.client.gameInfo.lastWin === Team.RedTeam)
            return "The last game was won by red team.";
        else
            return this.myname + " has been restarted since this game " +
                "and does not know which team won the last game.";
    }
    getGameTeams() {
        return "Red team: " + this.client.gameInfo.redteam.size + ", " +
            "Blue team: " + this.client.gameInfo.blueteam.size + " (in testing)";
    }
    getGameTimeApi() {
        var time = new Date().getTime() - this.client.gameInfo.gameStart.getTime();
        return '' + time;
    }

    _registerHandlers() {
        this.client.on("LOGIN", this._onLogin.bind(this));
        this.client.on("PLAYER_NEW", this._onPlayerNew.bind(this));
        this.client.on("PLAYER_LEAVE", this._onPlayerLeave.bind(this));
        this.client.on("PLAYER_LEVEL", this._onPlayerLevel.bind(this));
        this.client.on("PLAYER_KILL", this._onPlayerKill.bind(this));
        this.client.on("PLAYER_RETEAM", this._onPlayerReteam.bind(this));
        this.client.on("DETAILED_SCORE_CTF", this._onDetailedScore.bind(this));
        this.client.on("PLAYER_RESPAWN", this._onPlayerRespawn.bind(this));
        this.client.on("PLAYER_TYPE", this._onPlayerType.bind(this));
        this.client.on("GAME_FLAG", this._onGameFlag.bind(this));
        this.client.on("PLAYER_UPDATE", this._onPlayerUpdate.bind(this));
        this.client.on("EVENT_LEAVEHORIZON", this._onLeaveHorizon.bind(this));
        this.client.on("PLAYER_HIT", this._onPlayerHit.bind(this));
        this.client.on("PLAYER_FIRE", this._onPlayerFire.bind(this));
        this.client.on("SCORE_BOARD", this._onScoreBoard.bind(this));
        this.client.on("SERVER_CUSTOM", this._onServerCustom.bind(this));
        this.client.on("GAME_SPECTATE", this._onGameSpectate.bind(this));
        this.client.on("ERROR", this._onError.bind(this));

        this.client.on("CHAT_PUBLIC", this._onChatPublic.bind(this));
        this.client.on("CHAT_WHISPER", this._onChatWhisper.bind(this));
    }
    _registerPublicCommands() {
        // Commands with public responses
        this.public.addCommand("-game-time", function (id, rest) {
            if (rest !== '') return;

            this.sendChat(this.getGameTime());
        }.bind(this));
        this.public.addCommand('-last-win', function (id, rest) {
            if (rest !== '') return;

            this.sendChat(this.getLastWin());
        }.bind(this));
        this.public.addCommand('-game-teams', function (id, rest) {
            if (rest !== '') return;

            this.sendChat(this.getGameTeams());
        }.bind(this));
        this.public.addCommand('-statsbot-help', function (id, rest) {
            if (rest !== '') return;

            this.sendChat(HELPTEXT);
        }.bind(this));

        // Commands with whisper responses
        this.public.addCommand('-bot-ping', function (id, rest) {
            if (rest !== '') return;

            this.sendWhisper("I am " + this.myname + ", owner: " + this.owner, id);
        }.bind(this));
        this.public.addCommand('-prow-ping', function (id, rest) {
            if (rest !== '') return;

            this.sendWhisper(this.myname + ' cannot find prowlers for you :(');
        }.bind(this));
        this.public.addCommand('-swam-ping', function (id, rest) {
            if (rest !== '') return;

            this.sendWhisper("I'm using STARMASH, theme: " + this.myname);
        }.bind(this));
    }
    _registerWhisperCommands() {
        this.whisper.addCommand('-game-time', function (id, rest) {
            if (rest !== '') return;

            this.sendWhisper(this.getGameTime(), id);
        }.bind(this));
        this.whisper.addCommand('-anon-me', function (id, rest) {
            if (rest !== '') return;

            Logger.log("ANONYMISE", { id: id });

            let text = "You will now be anonymised from " +
                this.myname + " logs for this session.";
            this.sendWhisper(text, id);
        }.bind(this));
        this.whisper.addCommand('-anon-me-quiet', function (id, rest) {
            Logger.log("ANONYMISE", { id: id });
        }.bind(this));
        this.whisper.addCommand('-last-win', function (id, rest) {
            if (rest !== '') return;

            this.sendWhisper(this.getLastWin(), id);
        }.bind(this));
        this.whisper.addCommand('-game-teams', function (id, rest) {
            if (rest !== '') return;

            this.sendWhisper(this.getGameTeams(), id);
        }.bind(this));
        this.whisper.addCommand('-help', function (id, rest) {
            if (rest !== '') return;

            this.sendWhisper(HELPTEXT, id);
        }.bind(this));
        this.whisper.addCommand('help', function (id, rest) {
            this.whisper.execCommand('-help', id, rest);
        }.bind(this));

        // API commands
        this.whisper.addCommand('-api-game-time', function (id, rest) {
            if (rest !== '') return;

            this.sendWhisper(this.getGameTimeApi(), id);
        }.bind(this));
        this.whisper.addCommand('-api-game-start', function (id, rest) {
            if (rest !== '') return;

            this.sendWhisper('' + this.client.gameInfo.gameStart.getTime(), id);
        }.bind(this));
        this.whisper.addCommand('-api-firstgame', function (id, rest) {
            if (rest !== '') return;

            this.sendWhisper('' + this.client.gameInfo.firstGame, id);
        }.bind(this));
    }

    _onLogin(packet) {
        Logger.log("LOGIN", {});

        for (var i in packet.players) {
            const player = packet.players[i];

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

            if (player.name === this.owner) {
                this.ownerID = packet.id;
            }
        }
    }
    _onPlayerNew(packet) {
        Logger.log("PLAYER_NEW", {
            id: packet.id,
            team: packet.team,
            flag: packet.flag,
            type: packet.type,
            upgrades: packet.upgrades,
            name: packet.name
        });

        if (packet.name === this.owner) {
            this.ownerID = packet.id;
        }
    }
    _onPlayerLeave(packet) {
        Logger.log("PLAYER_LEAVE", { id: packet.id });

        if (packet.id == this.ownerID) {
            this.ownerID = 0;
        }
    }
    _onPlayerLevel(packet) {
        Logger.log("PLAYER_LEVEL", {
            id: packet.id,
            level: packet.level
        });
    }
    _onPlayerKill(packet) {
        Logger.log("PLAYER_KILL", {
            id: packet.id,
            killer: packet.killer,
            pos: [packet.posX, packet.posY]
        });
    }
    _onPlayerReteam(packet) {
        for (var idx in packet.players) {
            const player = packet.players[idx];

            Logger.log("PLAYER_RETEAM", {
                id: player.id,
                team: player.team
            });
        }
    }
    _onDetailedScore(packet) {
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
    _onPlayerRespawn(packet) {
        if (packet.id == this.client.id) {
            // Make statsbot spectate on new game   
            setTimeout(function () {
                this.client.send(Client.Command.ToPacket({
                    com: "spectate",
                    data: "-3"
                }));
            }, 5 * 1000);
        }
    }
    _onPlayerType(packet) {
        Logger.log("PLAYER_TYPE", {
            id: packet.id,
            type: packet.type
        });
    }
    _onGameFlag(packet) {
        if (packet.id !== 0) {
            Logger.log("FLAG_TAKEN", {
                id: packet.id,
                flag: packet.flag,
                type: packet.type
            });

            this.carriers[packet.flag - 1] = packet.id;
        }
        else {
            Logger.log("FLAG_RETURNED", {
                flag: packet.flag,
                // 1 indicates return, 2 indicates cap
                type: packet.type
            });

            this.carriers[packet.flag - 1] = packet.id;
        }
    }
    _onPlayerUpdate(packet) {
        if (packet.id == this.carriers[1]) {
            Logger.log("FLAG_UPDATE", {
                flag: 2,
                carrier: packet.id,
                pos: [packet.posX, packet.posY]
            });
        }
        else if (packet.id == this.carriers[0]) {
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
    _onLeaveHorizon(packet) {
        Logger.debug("LEAVE_HORIZON", {
            id: packet.id,
            type: packet.type
        });
    }
    _onPlayerHit(packet) {
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
    _onPlayerFire(packet) {
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
    _onScoreBoard(packet) {
        let distance2 = function (a, b) {
            return (a[0] - b[0]) * (a[0] - b[0]) +
                (a[1] - b[1]) * (a[1] - b[1]);
        };

        if (this.client.spectating) {
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
            }

            this.client.send(Client.Command.ToPacket({
                com: "spectate",
                data: "" + nearestID
            }));
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
    _onServerCustom(packet) {
        var obj = JSON.parse(packet.data);
        Logger.log("GAME_WIN", {
            team: obj.w,
            bounty: obj.b
        });
    }
    _onGameSpectate(packet) {
        Logger.debug("SPECTATE", { id: packet.id });
    }
    _onError(packet) {
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

    _onChatPublic(packet) {
        let text = packet.text;
        let firstWord = text.substr(0, text.indexOf(' '));
        let rest = text.substr(text.indexOf(' ') + 1);

        this.public.execCommand(firstWord, packet.id, rest);

        Logger.log("CHAT_PUBLIC", {
            id: packet.id,
            text: packet.text
        });
    }
    _onChatWhisper(packet) {
        let text = packet.text;
        let firstWord = text.substr(0, text.indexOf(' '));
        let rest = text.substr(text.indexOf(' ') + 1);
        this.whisper.execCommand(firstWord, packet.from, rest);

        Logger.log("CHAT_WHISPER", {
            to: packet.to,
            from: packet.from,
            text: packet.text
        });
    }
}