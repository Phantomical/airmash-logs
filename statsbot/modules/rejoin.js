
class GameEndLeaveModule {
    constructor() {}

    register(parent) {
        parent.on("SERVER_CUSTOM", function (packet) {
            setTimeout(function () {
                parent.client.close();
            }, 200);
        });
    }
}

module.exports = GameEndLeaveModule;
