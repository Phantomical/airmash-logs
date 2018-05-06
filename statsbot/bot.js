
class Bot {
    constructor(client, modules) {
        this.client = client;

        for (let name in modules) {
            this[name] = modules[name];
        }

        for (let name in modules) {
            this[name].register(this);
        }
    }

    on(type, fn) {
        this.client.on(type, fn);
    }
}

module.exports = Bot;
