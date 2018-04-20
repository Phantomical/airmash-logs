
export enum Team {
    BlueTeam = 1,
    RedTeam = 2,
    Unknown = 0
}

export enum Type {
    Predator = 1,
    Goliath = 2,
    Mowhawk = 3,
    Tornado = 4,
    Prowler = 5
}

export class Player {
    name: string
    id: number
    team: Team
    type: Type
    level: number
    flag: number
}

export class GameInfo {
    redteam: Set<number>
    blueteam: Set<number>
    players: Map<number, Player>
    scores: number[]

    lastWin: Team
    firstGame: boolean
    gameStart: Date

    constructor() {
        this.redteam = new Set();
        this.blueteam = new Set();
        this.players = new Map();

        this.scores = [0, 0];

        this.firstGame = true
        this.lastWin = Team.Unknown
        this.gameStart = new Date()
    }

    resetTeams() {
        this.redteam = new Set();
        this.blueteam = new Set();
        this.players = new Map();
    }

    playerNew(player: Player) {
        this.players.set(player.id, player);

        if (player.team === Team.BlueTeam) {
            this.blueteam.add(player.id);
        }
        else {
            this.blueteam.add(player.id);
        }
    }

    playerLeave(id: number) {
        this.players.delete(id);

        this.redteam.delete(id);
        this.blueteam.delete(id);
    }

    playerReteam(id: number, team: Team) {
        this.players.get(id).team = team;

        this.blueteam.delete(id);
        this.redteam.delete(id);

        if (team === Team.BlueTeam) {
            this.blueteam.add(id);
        }
        else {
            this.redteam.add(id);
        }
    }

    playerLevel(id: number, level: number) {
        this.players.get(id).level = level;
    }

    playerType(id: number, type: Type) {
        this.players.get(id).type = type;
    }

    playerFlag(id: number, flag: number) {
        this.players.get(id).flag = flag;
    }

    flagCap(team: Team) {
        this.scores[(team as number) - 1] += 1;
    }

    gameWin(team: Team) {
        this.lastWin = team;

        setTimeout(function () {
            this.gameStart = new Date();
            this.firstGame = false;
            this.scores = [0, 0];
        }.bind(this), 60 * 1000);
    }
}
