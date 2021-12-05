module.exports = class SongFirst extends Event {
    constructor() {
        super({
            name: "songFirst",
            once: false,
        });
    }

    async exec(queue, song, client) {
        const data = await client.getGuild({
            _id: queue.guild.id,
        });

        let channel = queue.textChannel;
        queue.skipVotes = [];
        if (channel) {
            if (data.announcements) {
                channel
                    .send(`${client.emotes.get("play")} Started playing **${song.name}**`)
                    .then((m) => {
                        song.playingMessage = m;
                    });
            }
        }
    }
};
