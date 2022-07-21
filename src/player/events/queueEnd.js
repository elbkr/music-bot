module.exports = class QueueEnd extends Event {
    constructor() {
        super({
            name: "queueEnd",
            once: false,
        });
    }

    async exec(queue, client) {
        let channel = queue.textChannel;

        queue.skipVotes = [];
        if (channel) {
            channel.send(
                `${client.emotes.get("queue")} Queue ended!`
            );
        }
    }
};
