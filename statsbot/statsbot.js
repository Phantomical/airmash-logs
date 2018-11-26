'use strict';

const AirmashClient = require('./client');
const GameAssets = require('./gamecode');
const Logger = require('./logger');
const throttledQueue = require('./throttle');

const CommandModule = require('./modules/commands');
const LoggingModule = require('./modules/logging');
const ScoreBoardRequester = require('./modules/sb_requester');
const AutoSpectate = require('./modules/autospec');
const GameEndLeaveModule = require('./modules/rejoin');
const AFKDetectorModule = require('./modules/afk-detect');
const ScoreTracker = require('./modules/score-tracker');
const DiscordNotifier = require('./modules/notify-discord');

const Bot = require('./bot');

const SERVERPACKET = GameAssets.serverPacket;
const CLIENTPACKET = GameAssets.clientPacket;

const serverURL = "wss://us.airmash.online/ctf1";

    //'wss://game-' + GameAssets.playHost +
    //'.airma.sh/' + GameAssets.playPath;
//'ws://127.0.0.1:3501'

if (process.argv.length < 3) {
    process.exit(-1);
}

const OWNER = process.argv[2];
const MYNAME = process.argv[3];

var chatThrottle = throttledQueue(4, 16 * 1000);

const modules = {
    command: new CommandModule(true, MYNAME, OWNER, Logger, chatThrottle),
    logging: new LoggingModule(Logger),
    sb_requester: new ScoreBoardRequester(20 * 1000),
    autospec: new AutoSpectate(5 * 1000),
    rejoin: new GameEndLeaveModule(),
    afk: new AFKDetectorModule(4),
    scores: new ScoreTracker(),
    discord: new DiscordNotifier(25)
};
const client = new AirmashClient(serverURL, true, {
    name: MYNAME,
    horizonX: (1 << 16) - 1,
    horizonY: (1 << 16) - 1
});

const statsbot = new Bot(client, modules);

