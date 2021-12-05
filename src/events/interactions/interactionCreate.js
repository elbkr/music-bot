module.exports = class InteractionCreate extends Event {
    constructor() {
        super({
            name: "interactionCreate",
            once: false,
        });
    }

    async exec(interaction) {
        if (interaction.guild) {
            const data = await this.client.getGuild({
                _id: interaction.guild.id,
            });

            if (interaction.isCommand()) return this.client.emit("slashCommands", interaction, data);
        }
    }
};
