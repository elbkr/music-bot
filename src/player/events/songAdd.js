const {msToSeconds} = require("../../utils/Utils");
const sf = require("seconds-formater");
const {MessageEmbed} = require("discord.js");

module.exports = class SongAdd extends Event {
    constructor() {
        super({
            name: "songAdd",
            once: false,
        });
    }

    async exec(queue, song) {
        let channel = queue.textChannel;
        let user = song.requestedBy;

        if (channel) {
            let timeLeft;
            if (queue.nowPlaying.name !== song.name) {
                let estimated = 0;
                queue.songs.forEach((s) => {
                    if (s.name !== song.name) {
                        estimated += s.milliseconds;
                    }
                });

                let stream = queue.nowPlaying.isLive
                    ? 0
                    : queue.connection.player._state.resource.playbackDuration;
                let seconds = msToSeconds(estimated - stream);


                if (seconds === 86400) {
                    timeLeft = sf.convert(seconds).format("D day");
                } else if (seconds >= 3600) {
                    timeLeft = sf.convert(seconds).format("H:MM:SS");
                } else {
                    timeLeft = sf.convert(seconds).format("M:SS");
                }
            } else {
                timeLeft = "Now";
            }


            let emb;
            if (queue.songs.indexOf(song) === 1 && queue.songs.length > 2) {
                emb = new EmbedBuilder()
                    .setAuthor({name: ` ${user.username} `, iconURL: user.displayAvatarURL()})
                    .setTitle(`${song.name}`)
                    .setURL(`${song.url}`)
                    .setColor("#2f3136")
                    .setThumbnail(song.thumbnail)
                    .addFields(
                        {
                            name: "Author",
                            value: song.author,
                            inline: true,
                        },
                        {
                            name: "Duration",
                            value: song.isLive ? "Live" : song.duration,
                            inline: true,
                        },
                        {
                            name: "Estimated time",
                            value: `Now`,
                            inline: true
                        },
                    )
            } else {
                emb = new EmbedBuilder()
                    .setAuthor({name: ` ${user.username} `, iconURL: user.displayAvatarURL()})
                    .setTitle(`${song.name}`)
                    .setURL(`${song.url}`)
                    .setColor("#2f3136")
                    .setThumbnail(song.thumbnail)
                    .addFields(
                        {
                            name: "Author",
                            value: song.author,
                            inline: true,
                        },
                        {
                            name: "Duration",
                            value: song.isLive ? "Live" : song.duration,
                            inline: true,
                        },
                        {
                            name: "Estimated time",
                            value: `${timeLeft}`,
                            inline: true
                        },
                    )

                if ((queue.songs.length - 1) !== 0) {
                    emb.addFields(
                        {
                            name: "Position in queue",
                            value: `${queue.songs.length - 1}`,
                            inline: false
                        })
                }
            }

            channel.send({embeds: [emb]});
        }
    }
};
