import Util from "../../utils/Utils.js";

export default class Play extends Interaction {
    constructor() {
        super({
            name: "play",
            description: "Adds a song to the queue",
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: "input",
                    description: "The search term or a link",
                    required: true,
                },
                {
                    type: ApplicationCommandOptionType.Boolean,
                    name: "force",
                    description: "Directly play the song",
                    required: false,
                },
            ],
        });
    }

    async exec(int, data) {
        const song = int.options.getString("input");
        const force = int.options.getBoolean("force");

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
            force &&
            members.size > 1 &&
            !isDJ &&
            !int.member.permissions.has("MANAGE_GUILD")
        ) {
            return int.reply({
                content:
                    "You must be a DJ or be alone in the voice channel to use the force function!",
                ephemeral: true,
            });
        }

        let source = await Util.sourceTest(song);
        let isPlaylist = Util.testPlaylist(song);

        if (isPlaylist) {
            return this.client.play(
                this.client,
                int,
                data,
                song,
                source,
                true,
                false,
                false,
                false
            );
        } else {
            return this.client.play(
                this.client,
                int,
                data,
                song,
                source,
                false,
                false,
                false,
                force
            );
        }
    }
};
