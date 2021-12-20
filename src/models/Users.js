const {Schema, model} = require("mongoose");

module.exports = model(
    "Users",
    new Schema(
        {
            _id: String,
            savedSongs: Array,
        },
        {versionKey: false}
    )
);
