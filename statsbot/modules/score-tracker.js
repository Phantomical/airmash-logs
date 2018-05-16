
class ScoreTracker {
    constructor() {
        this.red = 0;
        this.blue = 0;
    }

    register(parent) {
        this.parent = parent;

        parent.on("SCORE_DETAILED_CTF", this.onScoreDetailed.bind(this))
    }

    onScoreDetailed(packet) {
        this.blue = 0;
        this.red = 0;

        for (var i in packet.scores) {
            let score = packet.scores[i];

            if (this.parent.client.players[score.id].team == 1) {
                this.blue += score.score;
            }
            else {
                this.red += score.score;
            }
        }
    }
}

module.exports = ScoreTracker;
