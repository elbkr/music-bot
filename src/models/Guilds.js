const {Schema, model} = require("mongoose");

module.exports = model(
    "Guilds",
    new Schema(
        {
            _id: String,
            djRoles: {type: Array, default: null},
            voiceChannels: {type: Array, default: null},
            announcements: {type: Boolean, default: true},
        },
        {versionKey: false}
    )
);
