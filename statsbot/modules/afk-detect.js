
class AFKDetector {
    constructor(afkcount) {
        this.threshold = afkcount;
        this.players = {};
    }

    onScoreBoard(packet) {
        for (var i = 0; i < packet.rankings.length; ++i) {
            let ranking = packet.rankings[i];

            let player = this.players[ranking.id];
            if (!player) {
                this.players[ranking.id] = {
                    x: ranking.x,
                    y: ranking.y,
                    count: 0
                };
            }
            else if (player.x === ranking.x && player.y === ranking.y) {
                player.count += 1;
            }
            else {
                player.count = 0;
                player.x = ranking.x;
                player.y = ranking.y;
            }
        }
    }

    afkCount(team) {
        let cnt = 0;
        let todel = [];

        for (var id in this.players) {
            if (!this.parent.client.players[id]) {
                todel.push(id);
                continue;
            }

            if (this.players[id].count >= this.threshold &&
                this.parent.client.players[id].team === team &&
                this.players[id].x != 0 && this.players[id].y != 0)
            {
                cnt += 1;
            }
        }

        todel.forEach((val) => {
            delete this.players[val];
        });

        return cnt;
    }

    register(parent) {
        this.parent = parent;

        parent.on("SCORE_BOARD", this.onScoreBoard.bind(this));
    }
}

module.exports = AFKDetector;
