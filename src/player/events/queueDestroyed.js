module.exports = class QueueDestroyed extends Event {
    constructor() {
        super({
            name: "queueDestroyed",
            once: false,
        });
    }

    async exec(queue, client) {
        let channel = queue.textChannel;

        if (channel) {
            channel.send(
                `${client.emotes.get("queue")} Queue ended!`
            );
        }
    }
};
