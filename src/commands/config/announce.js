module.exports = class Announce extends Interaction {
    constructor() {
        super({
            name: "announce",
            description: "Toggles whether to send the started playing message",
            options: [
                {
                    type: ApplicationCommandOptionType.Boolean,
                    name: "mode",
                    description: "Whether to send the started playing message",
                    required: true
                }
            ],
        });
    }

    async exec(int, data) {
        if (!int.member.permissions.has("MANAGE_GUILD"))
            return int.reply({
                content: "You don't have the required permissions to do this!",
                ephemeral: true,
            });

        const mode = int.options.getBoolean("mode");

        if (mode === true) {
            if (data.announcements) {
                return int.reply({
                    content: "The announcements are already enabled!",
                    ephemeral: true,
                });
            }

            data.announcements = true;
            await data.save();

            int.reply({
                content: "Announcements are now enabled!",
                ephemeral: true,
            });
        } else {

            if (!data.announcements) {
                return int.reply({
                    content: "The announcements are already disabled!",
                    ephemeral: true,
                });
            }

            data.announcements = false;
            await data.save();

            int.reply({
                content: "Announcements are now disabled!",
                ephemeral: true,
            });
        }
    }
};
