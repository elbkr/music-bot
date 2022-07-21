module.exports = class Jump extends Interaction {
    constructor() {
        super({
            name: "jump",
            description: "Skips to a specific track in the queue",
            options: [
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: "song",
                    description: "The position of the track in the queue",
                    required: true,
                },
            ],
        });
    }

    async exec(int, data) {
        let number = int.options.getInteger("song");
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

        let isDJ = data.djRoles.some((r) => int.member._roles.includes(r));
        let isAllowed = data.voiceChannels.find((c) => c === channel.id);
        let members = channel.members.filter((m) => !m.user.bot);

        if (data.voiceChannels.length > 0 && !isAllowed) {
            return int.reply({
                content: `${this.client.emotes.get(
                    "nomic"
                )} You must be in one of the allowed voice channels to use this command!`,
                ephemeral: true,
            });
        }

        if (
            members.size > 1 &&
            !isDJ &&
            !int.member.permissions.has("MANAGE_GUILD")
        ) {
            return int.reply({
                content:
                    "You must be a DJ or be alone in the voice channel to use this command!",
                ephemeral: true,
            });
        }

        let queue = this.client.player.getQueue(int.guild.id);
        if (!queue)
            return int.reply({
                content: "There is no music playing in this guild!",
                ephemeral: true,
            });

        if (number > queue.songs.length || number < 0)
            return int.reply({
                content: "The number you provided is out of range!",
                ephemeral: true,
            });

        let song;
        queue.songs.forEach((s, i) => {
            if (i === number) {
                song = s;
            }
        });

        await queue.skip(number - 1);

        return int.reply({
            content: `${this.client.emotes.get("skip")} Skipped to **${number}. ${
                song.name
            }**!`,
            ephemeral: true,
        });
    }
};
