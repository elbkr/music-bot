const {
    InteractionType,
    ApplicationCommandType,
    ApplicationCommandOptionType,
    EmbedBuilder,
    ChannelType,
    ButtonBuilder,
    ButtonStyle,
    ActivityType,
} = require("discord.js")

const Types = () => {
    global.InteractionType = InteractionType;
    global.ChannelType = ChannelType;
    global.ButtonStyle = ButtonStyle;
    global.ButtonBuilder = ButtonBuilder;
    global.ApplicationCommandType = ApplicationCommandType;
    global.ApplicationCommandOptionType = ApplicationCommandOptionType;
    global.EmbedBuilder = EmbedBuilder;
    global.ActivityType = ActivityType;
}

module.exports = Types;