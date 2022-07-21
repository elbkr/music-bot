module.exports = class Volume extends Interaction {
  constructor() {
    super({
      name: "volume",
      description: "Changes the volume of the music player",
      options: [
        {
          type: ApplicationCommandOptionType.Integer,
          name: "value",
          description: "The value to set the volume to",
          required: true,
        },
      ],
    });
  }

  async exec(int, data) {
    const volume = int.options.getInteger("value");
    let channel = int.member.voice.channel;

    if (!channel)
      return int.reply({
        content: `${this.client.emotes.get(
          "nomic"
        )} You must be in a voice channel to use this command!`,
        ephemeral: true,
      });
    if (int.guild.members.me.voice.channel && channel !== int.guild.members.me.voice.channel)
      return int.reply({
        content: `${this.client.emotes.get(
          "nomic"
        )} You must be in the same voice channel as me to use this command!`,
        ephemeral: true,
      });

    let isDJ = data.djRoles.some((r) => int.member._roles.includes(r));
    let isAllowed = data.voiceChannels.find((c) => c === channel.id);
    let members = channel.members.filter((m) => !m.user.bot);

    if (data.voiceChannels.length > 0 && !isAllowed) {
      return int.reply({
        content: `${this.client.emotes.get(
          "nomic"
        )} You must be in one of the allowed voice channels to use this command!`,
        ephemeral: true,
      });
    }

    if (
      members.size > 1 &&
      !isDJ &&
      !int.member.permissions.has("MANAGE_GUILD")
    ) {
      return int.reply({
        content:
          "You must be a DJ or be alone in the voice channel to use this command!",
        ephemeral: true,
      });
    }

    if (volume < 0 || volume > 200)
      return int.reply({
        content: "The volume must be between 0 and 200!",
        ephemeral: true,
      });

    let hasQueue = this.client.player.hasQueue(int.guild.id);
    if (!hasQueue)
      return int.reply({
        content: "There is no music playing in this guild!",
        ephemeral: true,
      });

    let queue = this.client.player.getQueue(int.guild.id);

    queue.setVolume(volume);

    let emoji;
    if (volume === 0) {
      emoji = this.client.emotes.get("vol-mute");
    } else if (volume > 0 && volume <= 33) {
      emoji = this.client.emotes.get("vol-low");
    } else if (volume > 33 && volume <= 66) {
      emoji = this.client.emotes.get("vol-mid");
    } else if (volume > 66 && volume < 100) {
      emoji = this.client.emotes.get("vol-high");
    }

    return int.reply({
      content: `${emoji} Set the volume to ${volume}%!`,
      ephemeral: true,
    });
  }
};
