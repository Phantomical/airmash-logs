
import { StatsBot } from './statsbot';
import { playPath, playHost } from './gamecode'

if (process.argv.length < 4) {
    console.error("Usage: node runner.js <owner> <name>");
    process.exit(1);
}

let statsbot = new StatsBot(
    process.argv[2],
    process.argv[3],
    'wss://game-' + playHost + '.airma.sh/' + playPath,
    true);



