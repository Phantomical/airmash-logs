
class StatsbotLogger {
    constructor(logger) {
        this.logger = logger;

        this.carriers = {
            red: 0,
            blue: 0
        };
    }

    register(parent) {
        parent.on('LOGIN', this.handleLogin.bind(this));
        parent.on('PLAYER_NEW', this.handlePlayerNew.bind(this));
        parent.on('PLAYER_LEAVE', this.handlePlayerLeave.bind(this));
        parent.on('PLAYER_LEVEL', this.handlePlayerLevel.bind(this));
        parent.on('PLAYER_KILL', this.handlePlayerKill.bind(this));
        parent.on('PLAYER_FLAG', this.handlePlayerFlag.bind(this));
        parent.on('PLAYER_RETEAM', this.handlePlayerReteam.bind(this));
        parent.on('SCORE_DETAILED_CTF', this.handleDetailedScore.bind(this));
        parent.on('CHAT_WHISPER', this.handleWhisper.bind(this));
        parent.on('CHAT_PUBLIC', this.handleChatPublic.bind(this));
        parent.on('PLAYER_TYPE', this.handlePlayerType.bind(this));
        parent.on('GAME_FLAG', this.handleGameFlag.bind(this));
        parent.on('PLAYER_UPDATE', this.handlePlayerUpdate.bind(this));
        parent.on('LEAVE_HORIZON', this.handleLeaveHorizon.bind(this));
        parent.on('PLAYER_HIT', this.handlePlayerHit.bind(this));
        parent.on('PLAYER_FIRE', this.handlePlayerFire.bind(this));
        parent.on('SCORE_BOARD', this.handleScoreBoard.bind(this));
        parent.on('SERVER_CUSTOM', this.handleServerCustom.bind(this));
        parent.on('GAME_SPECTATE', this.handleGameSpectate.bind(this));

        parent.on('ERROR', this.handleError.bind(this));

        // TODO: Find out which packets are covered implicitly
    }

    handleLogin(packet) {
        this.logger.log("LOGIN", {});

        for (var idx in packet.players) {
            const player = packet.players[idx];

            this.logger.log("PLAYER_NEW", {
                id: player.id,
                flag: player.flag,
                team: player.team,
                upgrades: player.upgrades,
                name: player.name
            });
            this.logger.log("PLAYER_LEVEL", {
                id: player.id,
                level: player.level
            });
        }
    }
    handlePlayerNew(packet) {
        this.logger.log("PLAYER_NEW", {
            id: packet.id,
            team: packet.team,
            flag: packet.flag,
            type: packet.type,
            upgrades: packet.upgrades,
            name: packet.name
        });
    }
    handlePlayerLeave(packet) {
        this.logger.log("PLAYER_LEAVE");
    }
    handlePlayerLevel(packet) {
        this.logger.log("PLAYER_LEVEL", {
            id: packet.id,
            level: packet.level
        });
    }
    handlePlayerKill(packet) {
        this.logger.log("PLAYER_KILL", {
            id: packet.id,
            killer: packet.killer,
            pos: [packet.posX, packet.posY]
        });
    }
    handlePlayerFlag(packet) {
        this.logger.log("PLAYER_FLAG", {
            id: packet.id,
            flag: packet.flag
        });
    }
    handlePlayerReteam(packet) {
        for (var idx in packet.players) {
            const player = packet.players[idx];

            this.logger.log("PLAYER_RETEAM", {
                id: player.id,
                team: player.team
            });
        }
    }
    handleDetailedScore(packet) {
        for (var idx in packet.scores) {
            var score = packet.scores[idx];

            this.logger.log("PLAYER_DETAILED_SCORE", {
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
    handleWhisper(packet) {
        this.logger.log("CHAT_WHISPER", {
            to: packet.to,
            from: packet.from,
            text: packet.text
        });
    }
    handleChatPublic(packet) {
        this.logger.log("CHAT_PUBLIC", {
            id: packet.id,
            text: packet.text
        });
    }
    handlePlayerType(packet) {
        tihs.logger.log("PLAYER_TYPE", {
            id: packet.id,
            text: packet.text
        });
    }
    handleGameFlag(packet) {
        if (packet.id !== 0) {
            this.logger.log("FLAG_TAKEN", {
                id: packet.id,
                flag: packet.flag,
                type: packet.type
            });

            if (packet.flag === 1) {
                this.carriers.blue = packet.id;
            }
            else {
                this.carriers.red = packet.id;
            }
        }
        else {
            this.logger.log("FLAG_RETURNED", {
                flag: packet.flag,
                // 1 indicates return, 2 indicates cap
                type: packet.type
            });

            if (packet.flag === 1) {
                this.carriers.blue = 0;
            }
            else {
                this.carriers.red = 0;
            }
        }
    }
    handlePlayerUpdate(packet) {
        if (packet.id === this.carriers.red) {
            this.logger.log("FLAG_UPDATE", {
                flag: 2,
                carrier: packet.id,
                pos: [packet.posX, packet.posY]
            });
        }
        else if (packet.id === this.carriers.blue) {
            this.logger.log("FLAG_UPDATE", {
                flag: 1,
                carrier: packet.id,
                pos: [packet.posX, packet.posY]
            });
        }
    }
    handleLeaveHorizon(packet) {
        this.logger.log("LEAVE_HORIZON", {
            id: packet.id,
            type: packet.type
        });
    }
    handlePlayerHit(packet) {
        for (var idx in packet.players) {
            const player = packet.players[idx];

            this.logger.log("PLAYER_HIT", {
                id: packet.id,
                type: packet.type,
                pos: [packet.posX, packet.posY],
                owner: packet.owner,
                player_id: player.id,
                player_health: player.health
            });
        }
    }
    handlePlayerFire(packet) {
        for (var idx in packet.projectiles) {
            const projectile = packet.projectiles[idx];

            this.logger.log("PLAYER_FIRE", {
                id: packet.id,
                energy: packet.energy,
                proj_id: projectile.id,
                proj_type: projectile.type
            });
        }
    }
    handleScoreBoard(packet) {
        for (let idx in packet.rankings) {
            let ranking = packet.rankings[idx];

            this.logger.log("PLAYER_UPDATE", {
                id: ranking.id,
                pos: [ranking.x, ranking.y]
            });
        }

        for (let idx in packet.data) {
            let player = packet.data[idx];

            this.logger.log("SCORE_BOARD_DATA", {
                id: player.id,
                score: player.score,
                level: player.level
            });
        }
    }
    handleServerCustom(packet) {
        var obj = JSON.parse(packet.data);

        this.logger.log("GAME_WIN", {
            team: obj.w,
            bounty: obj.b
        });
    }
    handleGameSpectate(packet) {
        this.logger.log("SPECTATE", { id: packet.id });
    }

    handleError(packet) {
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

        this.logger.log("ERROR", obj);
    }
}
