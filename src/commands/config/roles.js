module.exports = class Roles extends Interaction {
    constructor() {
        super({
            name: "roles",
            description: "Manage DJ roles",
            options: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "add",
                    description: "Add a role to the DJ roles list",
                    options: [
                        {
                            type: ApplicationCommandOptionType.Role,
                            name: "role",
                            description: "The role to add",
                            required: true,
                        },
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "remove",
                    description: "Remove a role from the DJ roles list",
                    options: [
                        {
                            type: ApplicationCommandOptionType.Role,
                            name: "role",
                            description: "The role to remove",
                            required: true,
                        },
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "list",
                    description: "List all DJ roles",
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

        const cmd = int.options.getSubcommand()

        if (cmd === "add") {

            let role = int.options._hoistedOptions[0].role

            if (role.id === int.guild.id) {
                return int.reply({
                    content: "The *everyone* role is not manageable!",
                    ephemeral: true,
                });
            }
            let old = data.djRoles.find((r) => r === role.id);

            if (old) {
                return int.reply({
                    content: `The role ${role.name} is already in the list!`,
                    ephemeral: true,
                });
            }

            data.djRoles.push(role.id);
            await data.save();

            return int.reply({
                content: `Added role ${role.name} to the DJ roles list!`,
                ephemeral: true,
            });
        }
        if (cmd === "remove") {
            let role = int.options._hoistedOptions[0].role;

            if (role.id === int.guild.id) {
                return int.reply({
                    content: "The *everyone* role is not manageable!",
                    ephemeral: true,
                });
            }

            let old = data.djRoles.find((r) => r === role.id);

            if (!old)
                return int.reply({
                    content: `The role ${role.name} is not in the list!`,
                    ephemeral: true,
                });

            let index = data.djRoles.indexOf(role.id);
            data.djRoles.splice(index, 1);
            await data.save();

            return int.reply({
                content: `Removed role ${role.name} from the DJ roles list!`,
                ephemeral: true,
            });
        }
        if (cmd === "list") {
            let djs = data.djRoles;

            if (!djs.length)
                return int.reply({
                    content: "There are no DJ roles set!",
                    ephemeral: true,
                });

            let emb = new EmbedBuilder()
                .setTitle("DJ Roles list")
                .setThumbnail(int.guild.iconURL({size: 2048}))
                .setColor("#2f3136")
                .setDescription(`${djs.map((m) => `<@&${m}>`).join(" ")}`)
                .setTimestamp();

            return int.reply({embeds: [emb]});
        }
    }
};
