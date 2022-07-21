const {sourceTest, testPlaylist} = require("../../utils/Utils");

module.exports = class Playlist extends Interaction {
    constructor() {
        super({
            name: "playlist",
            description: "Adds a playlist to the queue",
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: "input",
                    description: "A playlist link",
                    required: true,
                },
            ],
        });
    }

    async exec(int, data) {
        const playlist = int.options.getString("input");

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


        let source = await sourceTest(playlist);
        let isPlaylist = testPlaylist(playlist);

        if (!isPlaylist)
            return int.reply({
                content: "That's not a valid playlist link!",
                ephemeral: true,
            });

        return this.client.play(
            this.client,
            int,
            data,
            playlist,
            source,
            true,
            false
        );
    }
};
