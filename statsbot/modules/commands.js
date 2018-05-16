
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
        throttle) {
        this.throttle = throttle;
        this.logger = logger;
        this.elem = new EventEmitter();
        this.myname = myname;
        this.myowner = myowner;

        if (activeCommands) {
            // API commands
            this.elem.on("-api-game-time", this.onGameTimeApi.bind(this));
            this.elem.on("-api-firstgame", this.onFirstGameApi.bind(this));
            this.elem.on("-api-game-start", this.onGameStartApi.bind(this));

            // Whisper + Public commands
            this.elem.on("-game-time", this.onGameTime.bind(this));
            this.elem.on("-last-win", this.onLastWin.bind(this));
            this.elem.on("-game-teams", this.onGameTeamsNospec.bind(this));
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

            this.elem.emit(packet.text.toLowerCase(), this.parent, packet.id, false);
        }.bind(this));

        parent.on("CHAT_WHISPER", function (packet) {
            this.elem.emit(
                packet.text.toLowerCase(),
                this.parent,
                packet.from,
                true
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

    sendWhisper(parent, text, id) {
        parent.client.send({
            c: CLIENTPACKET.WHISPER,
            id: id,
            text: text
        });
    }
    sendChat(parent, text) {
        parent.client.send({
            c: CLIENTPACKET.CHAT,
            text: text
        });
    }

    send(parent, text, id, whisper) {
        if (typeof whisper === "undefined") {
            if (!!id) {
                this.sendWhisper(parent, text, id);
            } else {
                this.sendChat(parent, text);
            }
        } else {
            if (whisper) {
                this.sendWhisper(parent, text, id);
            } else {
                this.sendChat(parent, text);
            }
        }
    }

    // API Commands
    onGameTimeApi(parent, id, whisper) {
        // Whisper command only
        if (!whisper) return;

        this.throttle(function () {
            var time = '' + (new Date() - parent.client.gameStart);
            this.send(parent, time, id);
        }.bind(this));
    }
    onFirstGameApi(parent, id, whisper) {
        // Whisper command only
        if (!whisper) return;

        this.throttle(function () {
            this.send(
                parent,
                '' + parent.client.firstgame,
                id
            );
        }.bind(this));
    }
    onGameStartApi(parent, id, whisper) {
        // Whisper command only
        if (!whisper) return;

        this.throttle(function () {
            this.send(
                parent,
                '' + parent.client.gameStart.getTime(),
                id
            );
        }.bind(this));
    }

    // Whisper + Public commands
    onGameTime(parent, id, whisper) {
        this.throttle(function () {
            var msPerMinute = 60 * 1000;
            var msPerHour = msPerMinute * 60;

            var time = new Date() - parent.client.gameStart;
            var text = '' + Math.floor(time / msPerHour) +
                ' hours, ' + (Math.floor(time / msPerMinute) % 60) +
                ' minutes, and ' + (Math.floor(time / 1000) % 60) +
                ' seconds have elapsed since this game started.';

            this.send(parent, text, id, whisper);
        }.bind(this));
    }
    onLastWin(parent, id, whisper) {
        this.throttle(function () {
            var msg;

            if (parent.client.lastWinner === 1)
                msg = "The last game was won by blue team.";
            else if (parent.client.lastWinner === 2)
                msg = "The last game was won by red team.";
            else
                msg = this.myname + " has been restarted since this game " +
                    "started and does not know which team won the last game.";

            this.send(parent, msg, id, whisper);
        }.bind(this));
    }
    onGameTeams(parent, id, whisper) {
        this.throttle(function () {
            let bluesize = parent.client.blueteam.size;
            let redsize = parent.client.redteam.size;

            var msg;
            if (parent.client.team == 1) {
                msg = "Blue team: " + (bluesize - 1) +
                    " + STATSBOT, Red team: " + redsize;
            }
            else {
                msg = "Blue team: " + bluesize +
                    ", Red team: " + (redsize - 1) +
                    " + STATSBOT";
            }

            this.send(parent, msg, id, whisper);
        }.bind(this));
    }
    onGameTeamsNospec(parent, id, whisper) {
        this.throttle(function () {
            const specCutoff = 2;
            let bluesize = parent.client.blueteam.size;
            let redsize = parent.client.redteam.size;

            let bluecnt = filter(parent.client.players, function (e) {
                return e.spec >= specCutoff && e.team == 1;
            }).length;
            let redcnt = filter(parent.client.players, function (e) {
                return e.spec >= specCutoff && e.team == 2;
            }).length;

            bluecnt += parent.afk.afkCount(1);
            redcnt += parent.afk.afkCount(2);

            var msg = "Blue team: " + (bluesize - bluecnt) +
                " (+" + bluecnt + " afk), Red team: " +
                (redsize - redcnt) + " (+" + redcnt + " afk)";

            this.send(parent, msg, id, whisper);
        }.bind(this));
    }
    onStatsbotHelp(parent, id) {
        this.throttle(function () {
            this.send(parent, HELPTEXT, id);
        }.bind(this));
    }

    // Whisper-only commands
    onAnonMeQuiet(parent, id, whisper) {
        if (!whisper) return;

        this.logger.log("ANONYMISE", { id: id });
    }
    onAnonMe(parent, id, whisper) {
        if (!whisper) return;

        this.onAnonMeQuiet(parent, id, whisper);

        this.throttle(function () {
            let text = "You will now be anonymised from " +
                this.myname + " logs for this session.";

            this.send(parent, text, id);
        }.bind(this));
    }
    onHelp(parent, id, whisper) {
        if (!whisper) return;

        this.throttle(function () {
            this.send(parent, HELPTEXT, id);
        }.bind(this));
    }

    // Public-only comands
    onSwamPing(parent, id, whisper) {
        if (whisper) return;

        this.throttle(function () {
            this.send(
                parent,
                "I'm using STARMASH, theme: " + this.myname,
                id
            );
        }.bind(this));
    }
    onBotPing(parent, id, whisper) {
        if (whisper) return;

        this.throttle(function () {
            this.send(
                parent,
                "I am " + this.myname + ", owner: " + this.myowner,
                id
            );
        }.bind(this));
    }
    onProwPing(parent, id, whisper) {
        if (whisper) return;

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