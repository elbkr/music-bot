module.exports = class Skip extends Interaction {
    constructor() {
        super({
            name: "skip",
            description: "Skips the current track",
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

        let queue = this.client.player.getQueue(int.guild.id);
        if (!queue || !queue.nowPlaying)
            return int.reply({
                content: "There is no music playing in this guild!",
                ephemeral: true,
            });

        let isDJ = data.djRoles.some((r) => int.member._roles.includes(r));
        let members = channel.members.filter((m) => !m.user.bot);

        if (members.size > 1 && !isDJ && !int.member.permissions.has("MANAGE_GUILD")) {
            let required = members.size === 2 ? 2 : Math.ceil(members.size / 2);

            if (queue.skipVotes.includes(int.user.id)) {
                return int.reply({
                    content: "You've already voted to skip the current track!",
                    ephemeral: true,
                });
            }

            queue.skipVotes.push(int.user.id);
            int.reply({
                content: `You voted to skip the current track! **${queue.skipVotes.length}/${required}**`,
            });

            if (queue.skipVotes.length >= required) {
                queue.skipVotes = [];
                let skipped = queue.skip();

                int.channel.send(
                    `${this.client.emotes.get("skip")} Skipped **${skipped.name}**!`
                );
            }
        } else {
            queue.skipVotes = [];
            let skipped = queue.skip();

            int.reply({
                content: `${this.client.emotes.get("skip")} Skipped **${
                    skipped.name
                }**!`,
                ephemeral: true,
            });
        }
    }
};
