import { Schema, model } from "mongoose";

/**
 * Per-guild configuration document.
 * @typedef {object} GuildDocument
 * @property {string} _id - Discord guild (snowflake) ID; also the primary key.
 * @property {string[]} djRoles - Role IDs exempt from vote-to-skip / gated commands.
 * @property {string[]} voiceChannels - Voice channel allow-list. Empty = no restriction.
 * @property {boolean} announcements - Whether `onPlayerStart` posts "Now playing" messages.
 * @property {?string} logChannelId - Text channel ID audit-log embeds are sent to, or `null`.
 */
const guildSchema = new Schema(
  {
    _id: String,
    djRoles: { type: [String], default: [] },
    voiceChannels: { type: [String], default: [] },
    announcements: { type: Boolean, default: true },
    logChannelId: { type: String, default: null },
  },
  { versionKey: false }
);

/**
 * Explicit collection name ("guilds") pins this model to a known, stable collection
 * regardless of the model name Mongoose would otherwise pluralize.
 * @type {import("mongoose").Model<GuildDocument>}
 */
export default model("Guild", guildSchema, "guilds");
