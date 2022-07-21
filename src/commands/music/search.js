const DMP = require("discord-music-player");

module.exports = class Search extends Interaction {
    constructor() {
        super({
            name: "search",
            description: "Searches for a track in YouTube",
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: "input",
                    description: "The track name",
                    required: true,
                },
            ],
        });
    }

    async exec(int, data) {
        const input = int.options.getString("input");

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

        int.reply({
            content: `${this.client.emotes.get(
                "search"
            )} Searching \`${input}\` ${this.client.emotes.get("youtube")}`,
        });

        let hasQueue = this.client.player.hasQueue(int.guild.id);
        let queue;
        if (!hasQueue) {
            queue = this.client.player.createQueue(int.guild.id);
            await queue.join(channel);
        } else {
            queue = this.client.player.getQueue(int.guild.id);
        }

        let results = await DMP.Utils.search(
            input,
            {requestedBy: int.user},
            queue,
            10
        ).catch((e) => {
            console.log(e);
        });

        if (!results) {
            if (!hasQueue) {
                await queue.stop();
            }

            return int.editReply({
                content: "No results found!",
            });
        }

        let emb = new EmbedBuilder()
            .setTitle("Search Results")
            .setColor("#2f3136")
            .setDescription(
                `Send the track number\n\n` +
                results.map((r, i) => `[${i + 1}. ${r.name}](${r.url})`).join("\n")
            );

        await int.editReply({content: " ", embeds: [emb]});

        let filter = (m) => m.author.id === int.user.id;
        let selection = await int.channel
            .awaitMessages({
                filter,
                max: 1,
                time: 30000,
                errors: ["time"],
            })
            .then((m) => {
                let select = m.first().content;

                m.first().delete();
                let song = results.find((r, i) => {
                    if (i + 1 === Number(select.replace(/^\D+/g, ""))) {
                        return r;
                    }
                });

                if (!song) {
                    return int.editReply({
                        content: "No results found!",
                        embeds: [],
                    });
                }

                int.deleteReply();

                return this.client.play(
                    this.client,
                    int,
                    data,
                    song,
                    "youtube",
                    false,
                    true
                );
            })
            .catch(() => {
                return int.editReply({
                    content: "You took too long to respond!",
                    embeds: [],
                });
            });

        await selection;
    }
};
