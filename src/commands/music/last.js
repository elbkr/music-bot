module.exports = class Last extends Interaction {
    constructor() {
        super({
            name: "last",
            description: "Adds the last played track to the queue",
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

        let lastTrack = queue.lastTrack;
        if (!lastTrack) {
            return int.reply({
                content: "There is no last track in the queue!",
                ephemeral: true,
            });
        }

        return this.client.play(
            this.client,
            int,
            data,
            lastTrack,
            "youtube",
            false,
            false,
            true
        );
    }
};
