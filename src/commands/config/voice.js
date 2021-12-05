const {MessageEmbed} = require('discord.js');

module.exports = class Voice extends Interaction {
    constructor() {
        super({
            name: "voice",
            description: "Manage the allowed voice channels",
            options: [
                {
                    type: "1",
                    name: "add",
                    description: "Add a voice channel to the allowed list",
                    options: [
                        {
                            type: "8",
                            name: "channel",
                            description: "The voice channel to add",
                            required: true,
                        },
                    ]
                },
                {
                    type: "1",
                    name: "remove",
                    description: "Remove a voice channel from the allowed list",
                    options: [
                        {
                            type: "8",
                            name: "channel",
                            description: "The voice channel to remove",
                            required: true,
                        },
                    ]
                },
                {
                    type: "1",
                    name: "list",
                    description: "List the allowed voice channels",
                },
            ],
        });
    }
    async exec(int, data) {
        if (!int.member.permissions.has("MANAGE_GUILD"))
            return int.reply({
                content: "You don't have the required permissions to do this!",
                ephemeral: true,
            });

        const add = int.options.getSubcommand("add")
        const remove = int.options.getSubcommand("remove")
        const list = int.options.getSubcommand("list")
        if(add) {

            let channel = int.options._hoistedOptions[0].channel

            if(channel.type !== "GUILD_VOICE" && channel.type !== "GUILD_STAGE_VOICE") {
                return int.reply({
                    content: "You can only add voice channels to the allowed list!",
                    ephemeral: true,
                });
            }

            let old = data.voiceChannels.find((c) => c === channel.id);

            if (old) {
                return int.reply({
                    content: `The channel ${channel.name} is already in the allowed list!`,
                    ephemeral: true,
                });
            }

            data.voiceChannels.push(channel.id);
            await data.save();

            return int.reply({
                content: `The channel ${channel.name} has been added to the allowed list!`,
                ephemeral: true,
            });
        }
        if(remove) {
            let channel = int.options._hoistedOptions[0].channel

            if(channel.type !== "GUILD_VOICE" && channel.type !== "GUILD_STAGE_VOICE") {
                return int.reply({
                    content: "You can only add voice channels to the allowed list!",
                    ephemeral: true,
                });
            }

            let old = data.voiceChannels.find((c) => c === channel.id);

            if (!old) {
                return int.reply({
                    content: `The channel ${channel.name} is not in the allowed list!`,
                    ephemeral: true,
                });
            }

            let index = data.voiceChannels.indexOf(channel.id);
            data.voiceChannels.splice(index, 1);
            await data.save();

            return int.reply({
                content: `The channel ${channel.name} has been removed from the allowed list!`,
                ephemeral: true,
            });
        }
        if(list) {
            let vcs = data.voiceChannels;

            if (!vcs.length) {
                return int.reply({
                    content: "There are no voice channels in the allowed list!",
                    ephemeral: true,
                });
            }

            let emb = new MessageEmbed()
                .setTitle("Allowed voice channels")
                .setThumbnail(int.guild.iconURL({size: 2048, dynamic: true}))
                .setColor("#2f3136")
                .setDescription(
                    `${vcs
                        .map((m) => `<#${m}>`)
                        .join(" ")}`
                )
                .setTimestamp();

            return int.reply({embeds: [emb]});
        }
    }
};
