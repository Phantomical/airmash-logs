
const CLIENTPACKET = require('../gamecode').clientPacket;

/* Requests a scoreboard packet every `period` ms
 */
class ScoreBoardRequester {
    constructor(period) {
        this.period = period;
    }

    register(parent) {
        this.cancelToken = setInterval(function () {
            parent.client.send({
                c: CLIENTPACKET.SCOREDETAILED
            });
        }, this.period);
    }
}

module.exports = ScoreBoardRequester;
