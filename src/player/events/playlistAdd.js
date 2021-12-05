const {msToSeconds} = require("../../utils/Utils");
const sf = require("seconds-formater");
const {MessageEmbed} = require("discord.js");

module.exports = class PlaylistAdd extends Event {
    constructor() {
        super({
            name: "playlistAdd",
            once: false,
        });
    }

    async exec(queue, playlist, client) {
        let channel = queue.textChannel;
        let user = playlist.songs[0].requestedBy;
        if (channel) {
            let timeLeft;
            if (queue.nowPlaying.name !== playlist.songs[0].name) {
                let estimated = 0;
                queue.songs.forEach((s) => {
                    estimated += s.milliseconds;
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

            playlist.milliseconds = 0;
            playlist.songs.forEach((song) => {
                if (song.name !== queue.nowPlaying.name) {
                    playlist.milliseconds += song.milliseconds;
                }
            });

            let seconds = msToSeconds(playlist.milliseconds);

            if (seconds === 86400) {
                playlist.duration = sf.convert(seconds).format("D day");
            } else if (seconds >= 3600) {
                playlist.duration = sf.convert(seconds).format("H:MM:SS");
            } else {
                playlist.duration = sf.convert(seconds).format("M:SS");
            }

            let emb = new MessageEmbed()
                .setAuthor(` ${user.username} `, user.displayAvatarURL({dynamic: true}))
                .setTitle(`${playlist.name}`)
                .setURL(`${playlist.url}`)
                .setThumbnail(`${playlist.songs[0].thumbnail}`)
                .setColor("#2f3136")
                .addFields(
                    {
                        name: "Author",
                        value: playlist.author,
                        inline: true,
                    },
                    {
                        name: "Duration",
                        value: playlist.duration,
                        inline: true,
                    },
                    {name: "Estimated time", value: `${timeLeft}`, inline: false},
                    {
                        name: "Songs",
                        value: `${playlist.songs.length}`,
                        inline: true,
                    }
                );
            channel.send({embeds: [emb]});
        }

    }
};
