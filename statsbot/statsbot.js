'use strict';

const AirmashClient = require('./client');
const GameAssets = require('./gamecode');
const Logger = require('./logger');
const throttledQueue = require('./throttle');

const CommandModule = require('./modules/commands');
const LoggingModule = require('./modules/logging');
const ScoreBoardRequester = require('./modules/sb_requester');

const Bot = require('./bot');

const SERVERPACKET = GameAssets.serverPacket;
const CLIENTPACKET = GameAssets.clientPacket;

const serverURL = 'wss://game-' + GameAssets.PlayHost + '.airma.sh/' + GameAssets.PlayPath;

if (process.argv.length < 3) {
    process.exit(-1);
}

const OWNER = process.argv[2];
const MYNAME = process.argv[3];

var chatThrottle = throttledQueue(4, 16 * 1000);

const modules = {
    command: new CommandModule(true, MYNAME, OWNER, Logger, chatThrottle),
    logging: new LoggingModule(Logger),
    sb_requester: new ScoreBoardRequester(30 * 1000)
};
const client = new AirmashClient(serverURL, true, {
    name: MYNAME,
    horizonX: (1 << 16) - 1,
    horizonY: (1 << 16) - 1
});

const statsbot = new Bot(client, modules);

