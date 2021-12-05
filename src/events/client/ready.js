module.exports = class Ready extends Event {
    constructor() {
        super({
            name: "ready",
            once: false,
        });
    }

    async exec() {
        this.client.user.setActivity("/play", { type: "WATCHING" });

        let allMembers = new Set();
        this.client.guilds.cache.forEach((guild) => {
            guild.members.cache.forEach((member) => {
                allMembers.add(member.user.id);
            });
        });

        let allChannels = new Set();
        this.client.guilds.cache.forEach((guild) => {
            guild.channels.cache.forEach((channel) => {
                allChannels.add(channel.id);
            });
        });
        this.client.logger.log(`Connected into ${this.client.user.tag}`, {
            tag: "Ready",
        });
        this.client.logger.log(
            `Watching ${this.client.guilds.cache.size} servers | ${allMembers.size} members | ${allChannels.size} channels`,
            {
                tag: "Data",
            }
        );

        const guild = await this.client.guilds.fetch(process.env.EMOJIS_GUILD_ID);
        if (guild) {
            await this.client.loadEmotes(guild).then(() => {
                this.client.logger.log("Loaded emotes!", {tag: "Emotes"});
            });
        }

        for (const guild of this.client.guilds.cache.values()) {
            await this.client.loadInteractions(guild.id);
        }
    }
};
