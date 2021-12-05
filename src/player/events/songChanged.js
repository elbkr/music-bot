module.exports = class SongChanged extends Event {
    constructor() {
        super({
            name: "songChanged",
            once: false,
        });
    }

    async exec(queue, newSong, oldSong, client) {
        const data = await client.getGuild({
            _id: queue.guild.id,
        });

        let channel = queue.textChannel;
        queue.lastTrack = oldSong;


        if (channel) {
            queue.skipVotes = [];
            if (oldSong.name !== newSong.name) {
                if (oldSong) {
                    if (oldSong.playingMessage) {
                        if (oldSong.playingMessage.deletable) {
                            await oldSong.playingMessage.delete();
                        }
                    }

                    if(data.announcements) {
                        channel
                            .send(
                                `${client.emotes.get("play")} Started playing **${newSong.name}**`
                            )
                            .then((m) => {
                                newSong.playingMessage = m;
                            });
                    }

                } else {
                    if(data.announcements) {
                        channel
                            .send(
                                `${client.emotes.get("play")} Started playing **${newSong.name}**`
                            )
                            .then((m) => {
                                newSong.playingMessage = m;
                            });
                    }
                }
            }
        }
    }
};
