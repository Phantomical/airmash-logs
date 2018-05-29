
class ScoreTracker {
    constructor() {
        this.red = 0;
        this.blue = 0;
    }

    register(parent) {
        this.parent = parent;

        parent.on("SCORE_DETAILED_CTF", this.onScoreDetailed.bind(this));
    }

    onScoreDetailed(packet) {
        this.blue = 0;
        this.red = 0;

        this.blue_active = 0;
        this.red_active = 0;

        for (var i in packet.scores) {
            let score = packet.scores[i];

            if (this.parent.client.players[score.id].team == 1) {
                this.blue += score.score;
                if (!this.parent.afk.isAfk(score.id)) {
                    this.blue_active += score.score;
                }
            }
            else {
                this.red += score.score;
                if (!this.parent.afk.isAfk(score.id)) {
                    this.red_active += score.score;
                }
            }
        }
    }
}

module.exports = ScoreTracker;
