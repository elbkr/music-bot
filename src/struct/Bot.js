import {Client, Collection, GatewayIntentBits, Partials, Routes, REST} from "discord.js";
import pkgm, { set } from "mongoose";
const { connect, connection } = pkgm

const db = connection

import { resolve } from "path";
import pkg from "glob";
const { sync } = pkg;

import { pathToFileURL } from "node:url"; 

import("./Interaction.js");
import("./Event.js");
import Logger from "../utils/Logger.js";
import guildsData from "../models/Guilds.js"
import player from "../player/index.js";
import { client } from '../../index.js'
import fs from "node:fs"

export default class Bot extends Client {
    constructor() {
        super({
            intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildBans, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildEmojisAndStickers, GatewayIntentBits.GuildIntegrations, GatewayIntentBits.GuildWebhooks, GatewayIntentBits.GuildInvites, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildScheduledEvents],
            partials: [Partials.Message, Partials.Reaction],
            allowedMentions: {
                parse: ["roles", "users"], repliedUser: false,
            },
        });

        this.events = new Collection();
        this.emotes = new Collection();
        this.logger = Logger
        this.interactions = new Collection();

        this.database = {};
        this.guildsData = guildsData;
        this.database.guilds = new Collection();

        db.on("connected", async () => this.logger.log(`Successfully connected to the database! (Latency: ${Math.round(await this.databasePing())}ms)`, {tag: "Database"}));
        db.on("disconnected", () => this.logger.error("Disconnected from the database!", {tag: "Database"}));
        db.on("error", (error) => this.logger.error(`Unable to connect to the database!\n${error.stack ? error + "\n\n" + error.stack : error}`, {
            tag: "Database",
        }));
        db.on("reconnected", async () => this.logger.log(`Reconnected to the database! (Latency: ${Math.round(await this.databasePing())}ms)`, {tag: "Database"}));
    }

    async getGuild({_id: guildId}, check = false) {
        if (this.database.guilds.get(guildId)) {
            return check ? this.database.guilds.get(guildId).toJSON() : this.database.guilds.get(guildId);
        } else {
            let guildData = check ? await this.guildsData.findOne({guildID: guildId}).lean() : await this.guildsData.findOne({guildID: guildId});
            if (guildData) {
                if (!check) this.database.guilds.set(guildId, guildData);
                return guildData;
            } else {
                guildData = new this.guildsData({_id: guildId});
                await guildData.save();
                this.database.guilds.set(guildId, guildData);
                return check ? guildData.toJSON() : guildData;
            }
        }
    }

    /* Start database */
    async loadDatabase() {
        set('strictQuery', true)
        return connect(process.env.MONGO, {
            useNewUrlParser: true, useUnifiedTopology: true
        });
    }

    /* Get database ping */
    async databasePing() {
        const cNano = process.hrtime();
        await db.db.command({ping: 1});
        const time = process.hrtime(cNano);
        return (time[0] * 1e9 + time[1]) * 1e-6;
    }

    /* Start database */
    async loadEmotes(guild) {
        /* Uncomment this line if you would like to de-register all emotes (Will Delete ALL Emojis on the Server!)
        guild.emojis.fetch().then(async emojis => {
            this.emotes.clear()
            emojis.forEach(async emoji => {
            await guild.emojis.delete(emoji, "Requested by Bot Owner")
            this.logger.log(`Deleted: ${emoji.name}`, { tag: "Emotes" })
            })
        })
        */

        if (guild) {
            let emotesArr = [
                'apple_music', 'fav',
                'line',        'looped',
                'noloop',      'nomic',
                'notfound',    'pause',
                'play',        'queue',
                'replay',      'resume',
                'search',      'shuffle',
                'skip',        'slider',
                'spotify',     'stop',
                'vol_high',    'vol_low',
                'vol_mid',     'vol_mute',
                'youtube',     'youtube_music'
                ]
            await guild.emojis.fetch().then(emojis => {
                emojis.forEach(e => {
                    emotesArr = emotesArr.reduce((acc, curr) => {
                        if (curr !== e.name) acc.push(curr)
                        return acc
                      }, [])

                    if (e.name.includes("_")) {
                        let name = e.name.replace("_", "-")
                        if (e.animated) {
                            this.emotes.set(name, `<${e.identifier}>`);
                        } else {
                            this.emotes.set(name, `<:${e.identifier}>`);
                        }
                    } else {
                        if (e.animated) {
                            this.emotes.set(e.name, `<${e.identifier}>`);
                        } else {
                            this.emotes.set(e.name, `<:${e.identifier}>`);
                        }
                    }
                })       

                if (emotesArr.length > 0) {
                    let emoteURL = `https://github.com/elbkr/music-bot/blob/main/resource/emojis/`;
                    this.logger.log(`${emotesArr.length} Emotes are not registered! Adding them now...`, { tag: "Emotes" })
                    emotesArr.forEach(async emote => {
                        emoteURL += emote
                        if (emote === "slider") {
                            emoteURL += ".gif?raw=true"
                            try { guild.emojis.create({ attachment: emoteURL, name: emote }); this.logger.log(`Added Emote ${emote}`, { tag: "Emotes" }) } catch (error) { this.logger.error(`Unable to load Emote ${emote}!\n${error.stack ? error + "\n\n" + error.stack : error}`, { tag: "Emotes", });
}
                        } else {
                            emoteURL += ".png?raw=true"
                            try { guild.emojis.create({ attachment: emoteURL, name: emote }); this.logger.log(`Added Emote ${emote}`, { tag: "Emotes" }) } catch (error) { this.logger.error(`Unable to load Emote ${emote}!\n${error.stack ? error + "\n\n" + error.stack : error}`, { tag: "Emotes", });
                        }
                     }
                    emoteURL = `https://github.com/elbkr/music-bot/blob/main/resource/emojis/`;
                    })
                }
            })

        }

    }

    /* Start player */
    async loadPlayer() {
        return player(this);
    }


    /* Load slash commands for each guild */
    async loadInteractions(guildId) {
        const intFile = await sync(resolve("./src/commands/**/*.js"));
        let data = []
        for (let filepath of intFile) {
            filepath = pathToFileURL(filepath)
            let File = await import(filepath);
            File = File.default

            if (!(File.prototype instanceof Interaction)) continue;
            const interaction = new File();
            interaction.client = this;
            this.interactions.set(interaction.name, interaction);

            data.push({
                name: interaction.name,
                description: interaction.description,
                type: interaction.type,
                options: interaction.options
            });
        }

        const rest = new REST({version: "10"}).setToken(process.env.TOKEN);

        rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId), {
            body: data,
        }).catch((err) => {
            console.log(err);
        })
    }

    /* Load events */
    async loadEvents() {
        const evtFile = await sync(resolve("./src/events/**/*.js"));
            evtFile.forEach(async (filepath) => {
            filepath = pathToFileURL(filepath)
            let File = await import(filepath);
            File = File.default

            if (!(File.prototype instanceof Event)) return;
            const event = new File();
            event.client = this;
            this.events.set(event.name, event);
            const emitter = event.emitter ? typeof event.emitter === "string" ? this[event.emitter] : emitter : this;
            emitter[event.type ? "once" : "on"](event.name, (...args) => event.exec(...args));
        });
    }

    /* Start the bot */
    async start(token) {
        await this.loadEvents();
        await this.loadDatabase();
        await this.loadPlayer()
        return client.login(token);
    }
};
