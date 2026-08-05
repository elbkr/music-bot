import { Schema, model } from "mongoose";

/**
 * A single saved track.
 * @typedef {object} FavoriteTrack
 * @property {string} title
 * @property {?string} author
 * @property {string} uri
 * @property {?string} source - Kazagumo `track.sourceName` (e.g. `"youtube"`, `"spotify"`).
 * @property {Date} addedAt
 */
const favoriteSchema = new Schema(
  {
    title: { type: String, required: true },
    author: { type: String, default: null },
    uri: { type: String, required: true },
    source: { type: String, default: null },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

/**
 * Per-user favorites document.
 * @typedef {object} UserDocument
 * @property {string} _id - Discord user (snowflake) ID; also the primary key.
 * @property {FavoriteTrack[]} favorites
 */
const userSchema = new Schema(
  {
    _id: String,
    favorites: { type: [favoriteSchema], default: [] },
  },
  { versionKey: false }
);

/**
 * Explicit collection name, same reasoning as Guild.model.js: pins this model to a known,
 * stable collection regardless of Mongoose's default pluralization.
 * @type {import("mongoose").Model<UserDocument>}
 */
export default model("User", userSchema, "users");
