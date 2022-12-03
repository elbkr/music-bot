const paginationEmbed = require("../../utils/Pagination");
const users = require("../../models/Users")

module.exports = class Fav extends Interaction {
    constructor() {
        super({
            name: "fav",
            description: "Manage your favorite songs",
            options: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "add",
                    description: "Add the current playing song to your favorites",
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "remove",
                    description: "Remove a song from your favorites",
                    options: [
                        {
                            type: ApplicationCommandOptionType.Integer,
                            name: "song",
                            description: "The number of the song",
                            required: true,
                        },
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "list",
                    description: "List your favorite songs",
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "play",
                    description: "Play one of your favorite songs",
                    options: [
                        {
                            type: ApplicationCommandOptionType.Integer,
                            name: "song",
                            description: "The number of the song",
                            required: true,
                        },
                    ]
                },
            ],
        });
    }

    async exec(int, data) {
        await int.deferReply()
        const cmd = int.options.getSubcommand()

        let user = await users.findOne({
            _id: int.user.id,
        });

        if (!user) {
            user = new users({
                _id: int.user.id,
                savedSongs: [],
            });
        }

        if (cmd === "add") {
            let hasQueue = this.client.player.hasQueue(int.guild.id);
            if (!hasQueue) {
                return int.editReply({
                    content: "There is no music playing in this guild!",
                    ephemeral: true,
                });
            }

            let queue = this.client.player.getQueue(int.guild.id);

            let song = queue.nowPlaying;
            if (!song) {
                return int.editReply({
                    content: "There is no music playing in this guild!",
                    ephemeral: true,
                });
            }

            let old = user.savedSongs.find((s) => s.name === song.name);

            if (old) {
                return int.editReply({
                    content: "This song is already in your favorites!",
                    ephemeral: true,
                });
            }

            user.savedSongs.push({name: song.name, url: song.url});
            await user.save();

            return int.editReply({
                content: `${this.client.emotes.get("fav")} Added ${song.name} to your favorites!`,
                ephemeral: true,
            });
        }
        if (cmd === "remove") {
            let index = int.options._hoistedOptions[0].value;

            let old = user.savedSongs.find((s, i) => i === index - 1);

            if (!old)
                return int.editReply({
                    content: "This song is not in your favorites!",
                    ephemeral: true,
                });

            user.savedSongs.splice(index - 1, 1);
            await user.save();

            return int.editReply({
                content: `${this.client.emotes.get("fav")} Removed **${index}. ${old.name}** from your favorites!`,
                ephemeral: true,
            });
        }

        if (cmd === "list") {
            let sng = user.savedSongs;

            if (!sng.length)
                return int.editReply({
                    content: "You don't have any favorite songs!",
                    ephemeral: true,
                });


            let btn1 = new ButtonBuilder()
                .setCustomId("previousbtn")
                .setLabel("Previous")
                .setStyle(ButtonStyle.Secondary);

            const btn2 = new ButtonBuilder()
                .setCustomId("nextbtn")
                .setLabel("Next")
                .setStyle(ButtonStyle.Primary);

            let currentEmbedItems = [];
            let embedItemArray = [];
            let pages = [];

            let buttonList = [btn1, btn2];

            if (sng.length > 10) {
                sng.forEach((s, i) => {
                    s.index = i + 1;
                    if (currentEmbedItems.length < 10) currentEmbedItems.push(s);
                    else {
                        embedItemArray.push(currentEmbedItems);
                        currentEmbedItems = [s];
                    }
                });

                embedItemArray.push(currentEmbedItems);

                embedItemArray.forEach((x) => {

                    let emb = new EmbedBuilder()
                        .setTitle(`${this.client.emotes.get("fav")} Favorite Songs`)
                        .setThumbnail(int.user.displayAvatarURL({size: 2048, dynamic: true}))
                        .setColor("#2f3136")
                        .setDescription(`${x.map((s) => `[${s.index}. ${s.name}](${s.url})`).join("\n")}`)
                        .setTimestamp();

                    pages.push(emb);
                });

                await paginationEmbed(int, pages, buttonList);
            } else {

                let emb = new EmbedBuilder()
                    .setTitle(`${this.client.emotes.get("fav")} Favorite Songs`)
                    .setThumbnail(int.user.displayAvatarURL({size: 2048}))
                    .setColor("#2f3136")
                    .setDescription(`${sng.map((s, i) => `[${i + 1}. ${s.name}](${s.url})`).join("\n")}`)
                    .setTimestamp();

                return int.editReply({embeds: [emb]});
            }
        }

        if (cmd === "play") {

            let index = int.options._hoistedOptions[0].value;


            let sng = user.savedSongs.find((s, i) => i + 1 === Number(index));
            if (!sng)
                return int.editReply({
                    content: "This song is not in your favorites!",
                    ephemeral: true,
                });

            await int.editReply({
                content: `${this.client.emotes.get("fav")} Playing **${sng.name}**!`,
                ephemeral: true,
            });

            return this.client.play(this.client, int, data, sng.url, "youtube", false, true, false, false);

        }
    }
};
