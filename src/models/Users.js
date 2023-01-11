import {Schema, model} from "mongoose";

export default model(
    "Users",
    new Schema(
        {
            _id: String,
            savedSongs: Array,
        },
        {versionKey: false}
    )
);
