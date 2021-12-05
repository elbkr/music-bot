module.exports = class ChannelEmpty extends Event {
    constructor() {
        super({
            name: "channelEmpty",
            once: false,
        });
    }
    async exec(queue) {
       if(queue) {
           queue.skipVotes = [];
       }
    }
};
