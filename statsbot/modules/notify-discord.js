
const Discord = require('discord.js');
const config = require('../config.json');

class DiscordNotifier {
    // playerLimit: the number of players below which
    // statsbot won't notify of a new game.
    constructor(playerLimit) {
        this.newGame = false;
        this.playerLimit = playerLimit;

        if (config.token !== "") {
            this.client = new Discord.Client();

            this.client.on("ready", () => {
                let guild = this.client.guilds.array()[0];
                // We only want to send messages to 
                // the general channel
                this.channel = guild.channels.find("name", "general");
            });

            this.client.login(config.token);
        }
        else {
            // If we can't log into discord, then 
            // disable messages
            this.channel = null;
        }
    }

    register(parent) {
        parent.on("SERVER_CUSTOM", () => {
            setTimeout(() => {
                this.newGame = true;
            }, 60 * 1000);
        });



        parent.on("SCORE_BOARD", packet => {
            if (!this.newGame) return;
            if (!this.channel) return;

            let nplayers = packet.rankings.length;

            if (nplayers < this.playerLimit) return;

            this.newGame = false;
            this.channel.send(
                `New CTF game starting now with ${nplayers} players!`
            );
        });
    }
}

module.exports = DiscordNotifier;
