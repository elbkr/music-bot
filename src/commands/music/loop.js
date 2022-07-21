const {RepeatMode} = require("discord-music-player");

module.exports = class Loop extends Interaction {
    constructor() {
        super({
            name: "loop",
            description: "Changes the loop mode",
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: "mode",
                    description: "Loop mode",
                    required: true,
                    choices: [
                        {
                            name: "track",
                            value: "track",
                        },
                        {
                            name: "queue",
                            value: "queue",
                        },
                        {
                            name: "disabled",
                            value: "disabled",
                        },
                    ],
                },
            ],
        });
    }

    async exec(int, data) {
        const mode = int.options.getString("mode");
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

        if (members.size > 1 && !isDJ && !int.member.permissions.has("MANAGE_GUILD")) {
            return int.reply({
                content:
                    "You must be a DJ or be alone in the voice channel to use this command!",
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

        if (mode === "track") {
            if (queue.repeatMode === RepeatMode.SONG) {
                return int.reply({
                    content: "The current track is alredy looped!",
                    ephemeral: true,
                });
            } else {
                queue.setRepeatMode(RepeatMode.SONG);
                return int.reply({
                    content: `${this.client.emotes.get(
                        "looped"
                    )} Looped the current track!`,
                    ephemeral: true,
                });
            }
        } else if (mode === "queue") {
            if (queue.repeatMode === RepeatMode.QUEUE) {
                return int.reply({
                    content: "The current queue is already looped!",
                    ephemeral: true,
                });
            } else {
                queue.setRepeatMode(RepeatMode.QUEUE);
                return int.reply({
                    content: `${this.client.emotes.get(
                        "looped"
                    )} Looped the current queue!`,
                    ephemeral: true,
                });
            }
        } else if (mode === "disabled") {
            if (queue.repeatMode === RepeatMode.DISABLED) {
                return int.reply({
                    content: "The loop mode is already disabled!",
                    ephemeral: true,
                });
            } else {
                queue.setRepeatMode(RepeatMode.DISABLED);
                return int.reply({
                    content: `${this.client.emotes.get(
                        "noloop"
                    )} Disabled the loop mode!`,
                    ephemeral: true,
                });
            }
        }
    }
};
