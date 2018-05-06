
const EventEmitter = require('events');
const GameCode = require('../gamecode');

const CLIENTPACKET = GameCode.clientPacket;
const HELPTEXT = 'STATSBOT docs: https://steamroller.starma.sh/statsbot';

// Utility function for filtering players
function filter(players, fn) {
    let arr = [];
    for (var i in players) {
        if (fn(players[i])) {
            arr.push(players[i]);
        }
    }
    return arr;
}

class CommandsModule {
    constructor(
        activeCommands,
        myname,
        myowner,
        logger,
        throttle)
    {
        this.throttle = throttle;
        this.logger = logger;
        this.elem = new EventEmitter();
        this.myname = myname;
        this.myowner = myowner;

        if (activeCommands) {
            // API commands
            this.elem.on("-game-time-api", onGameTimeApi.bind(this));
            this.elem.on("-first-game-api", onFirstGameApi.bind(this));
            this.elem.on("-game-start-api", onGameStartApi.bind(this));

            // Whisper + Public commands
            this.elem.on("-game-time", this.onGameTime.bind(this));
            this.elem.on("-last-win", this.onLastWin.bind(this));
            this.elem.on("-game-teams", this.onGameTeams.bind(this));
            this.elem.on("-game-teams-nospec", this.onGameTeamsNospec.bind(this));
            this.elem.on("-statsbot-help", this.onStatsbotHelp.bind(this));

            // Whisper-only commands
            this.elem.on("-anon-me-quiet", this.onAnonMeQuiet.bind(this));
            this.elem.on("-anon-me", this.onAnonMe.bind(this));
            this.elem.on("help", this.onHelp.bind(this));
            this.elem.on("-help", this.onHelp.bind(this));

            // Public-only commands
            this.elem.on("-swam-ping", this.onSwamPing.bind(this));
            this.elem.on("-prow-ping", this.onProwPing.bind(this));
        }

        // -bot-ping is always on
        this.elem.on("-bot-ping", this.onBotPing.bind(this));
    }


    register(parent) {
        this.parent = parent;

        parent.on("CHAT_PUBLIC", function (packet) {
            // TODO: Allow for command arguments
            //let split = packet.text.split(' ', 2);

            this.elem.emit(packet.text.toLowerCase(), this.parent);
        }.bind(this));

        parent.on("CHAT_WHISPER", function (packet) {
            this.elem.emit(
                packet.text.toLowerCase(),
                this.parent,
                packet.from
            );
        }.bind(this));
    }

    throttle(fn) {
        if (!!this.throttle) {
            this.throttle(fn);
        }
        else {
            fn();
        }
    }
    log(text) {
        if (!!this.logger.log) {
            this.logger.log(text);
        }
    }

    send(parent, text, id) {
        if (!!id) {
            parent.client.send({
                c: CLIENTPACKET.WHISPER,
                id: id,
                text: text
            });
        }
        else {
            parent.client.send({
                c: CLIENTPACKET.CHAT,
                text: text
            });
        }
    }

    // API Commands
    onGameTimeApi(parent, id) {
        // Whisper command only
        if (!id) return;

        this.throttle(function () {
            var time = '' + (new Date() - parent.client.gameStart);
            this.send(parent, time, id);
        }.bind(this));
    }
    onFirstGameApi(parent, id) {
        // Whisper command only
        if (!id) return;

        this.throttle(function () {
            this.send(
                parent,
                parent.client.firstgame,
                id
            );
        }.bind(this));
    }
    onGameStartApi(parent, id) {
        // Whisper command only
        if (!id) return;

        this.throttle(function () {
            this.send(
                parent,
                parent.client.gameStart.getTime(),
                id
            );
        }.bind(this));
    }

    // Whisper + Public commands
    onGameTime(parent, id) {
        this.throttle(function () {
            var msPerMinute = 60 * 1000;
            var msPerHour = msPerMinute * 60;

            var time = new Date() - client.gameStart;
            var text = '' + Math.floor(time / msPerHour) +
                ' hours, ' + (Math.floor(time / msPerMinute) % 60) +
                ' minutes, and ' + (Math.floor(time / 1000) % 60) +
                ' seconds have elapsed since this game started.';

            this.send(parent, text, id);
        }.bind(this));
    }
    onLastWin(parent, id) {
        this.throttle(function () {
            var msg;

            if (client.lastWinner === 1)
                msg = "The last game was won by blue team.";
            else if (client.lastWinner === 2)
                msg = "The last game was won by red team.";
            else
                msg = this.myname + " has been restarted since this game " +
                    "and does not know which team won the last game.";

            this.send(parent, msg, id);
        }.bind(this));
    }
    onGameTeams(parent, id) {
        this.throttle(function () {
            var msg;
            if (client.team == 1) {
                msg = "Blue team: " + (client.blueteam.size - 1) +
                    " + STATSBOT, Red team: " + client.redteam.size;
            }
            else {
                msg = "Blue team: " + client.blueteam.size +
                    ", Red team: " + (client.redteam.size - 1) +
                    " + STATSBOT";
            }

            this.send(parent, msg, id);
        }.bind(this));
    }
    onGameTeamsNospec(parent, id) {
        this.throttle(function () {
            const specCutoff = 2;

            let bluecnt = filter(client.players, function (e) {
                return e.spec >= specCutoff && e.team == BlueTeam;
            }).length;
            let redcnt = filter(client.players, function (e) {
                return e.spec >= specCutoff && e.team == RedTeam;
            }).length;

            var msg = "Blue team: " + (client.blueteam.size - bluecnt) +
                " (+" + bluecnt + " in spec), Red team: " +
                (client.redteam.size - redcnt) + " (+" + redcnt +
                " in spec)";

            this.send(parent, msg, id);
        }.bind(this));
    }
    onStatsbotHelp(parent, id) {
        this.throttle(function () {
            this.send(parent, HELPTEXT, id);
        }.bind(this));
    }

    // Whisper-only commands
    onAnonMeQuiet(parent, id) {
        if (!id) return;

        this.logger.log("ANONYMISE", { id: id });
    }
    onAnonMe(parent, id) {
        if (!id) return;

        onAnonMeQuiet(parent, id);

        this.throttle(function () {
            let text = "You will now be anonymised from " +
                this.myname + " logs for this session.";

            this.send(parent, text, id);
        }.bind(this));
    }
    onHelp(parent, id) {
        if (!id) return;

        this.throttle(function () {
            this.send(parent, HELPTEXT, id);
        }.bind(this));
    }

    // Public-only comands
    onSwamPing(parent, id) {
        if (!!id) return;

        this.throttle(function () {
            this.send(
                parent,
                "I'm using STARMASH, theme: " + this.myname,
                id
            );
        }.bind(this));
    }
    onBotPing(parent, id) {
        if (!!id) return;

        this.throttle(function () {
            this.send(
                parent,
                "I am " + this.myname + ", owner: " + this.owner,
                id
            );
        }.bind(this));
    }
    onProwPing(parent, id) {
        if (!!id) return;

        this.throttle(function () {
            this.send(
                parent,
                this.myname + " cannot find prowlers for you :(",
                id
            );
        }.bind(this));
    }
}

module.exports = CommandsModule;