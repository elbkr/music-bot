const sf = require("seconds-formater");
const {progressBar} = require("../../player/functions/progress-bar");
const {msToSeconds} = require("../../utils/Utils");

module.exports = class NowPlaying extends Interaction {
    constructor() {
        super({
            name: "nowplaying",
            description: "Displays the current playing track",
        });
    }

    async exec(int, data) {
        let channel = int.member.voice.channel;

        if (!channel)
            return int.reply({
                content: `${this.client.emotes.get(
                    "nomic"
                )} You must be in a voice channel to use this command!`,
                ephemeral: true,
            });
        if (int.guild.members.me.voice.channel && channel !== int.guild.members.me.voice.channel)
            return int.reply({
                content: `${this.client.emotes.get(
                    "nomic"
                )} You must be in the same voice channel as me to use this command!`,
                ephemeral: true,
            });

        let isAllowed = data.voiceChannels.find((c) => c === channel.id);

        if (data.voiceChannels.length > 0 && !isAllowed) {
            return int.reply({
                content: `${this.client.emotes.get(
                    "nomic"
                )} You must be in one of the allowed voice channels to use this command!`,
                ephemeral: true,
            });
        }

        let hasQueue = this.client.player.hasQueue(int.guild.id);
        if (!hasQueue) {
            return int.reply({
                content: "There is no music playing in this guild!",
                ephemeral: true,
            });
        }

        let queue = this.client.player.getQueue(int.guild.id);

        let song = queue.nowPlaying;
        if (!song) {
            return int.reply({
                content: "There is no music playing in this guild!",
                ephemeral: true,
            });
        }

        let total = song.milliseconds;
        let stream = queue.connection.player._state.resource.playbackDuration;

        let seconds = msToSeconds(stream);
        let time;
        if (seconds === 86400) {
            time = sf.convert(seconds).format("D day");
        } else if (seconds >= 3600) {
            time = sf.convert(seconds).format("H:MM:SS");
        } else {
            time = sf.convert(seconds).format("M:SS");
        }

        let emb = new EmbedBuilder()
            .setTitle(song.name)
            .setURL(song.url)
            .setColor("#2f3136")
            .setThumbnail(song.thumbnail)
            .setDescription(
                `${progressBar(
                    total,
                    stream,
                    18,
                    "▬",
                    this.client.emotes.get("line"),
                    this.client.emotes.get("slider")
                )} ${time}/${song.duration}`
            );

        return int.reply({embeds: [emb]});
    }
};
