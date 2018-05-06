
const CLIENTPACKET = require('../gamecode').clientPacket;

class AutoSpectate {
    constructor(delay) {
        this.delay = delay;
    }

    register(parent) {
        this.parent = parent;

        parent.on("LOGIN", this.spectate.bind(this));
        parent.on("PLAYER_RESPAWN", function (packet) {
            if (packet.id === parent.client.id) {
                this.spectate();
            }
        }.bind(this));
    }

    spectate() {
        setTimeout(function () {
            this.parent.client.send({
                c: CLIENTPACKET.COMMAND,
                com: "spectate",
                data: "-3"
            });
        }.bind(this), this.delay);
    }
}

module.exports = AutoSpectate;
