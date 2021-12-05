module.exports = class Playlist extends Interaction {
  constructor() {
    super({
      name: "playlist",
      description: "Adds a playlist to the queue",
      options: [
        {
          type: "3",
          name: "input",
          description: "A playlist link",
          required: true,
        },
      ],
    });
  }

  async exec(int, data) {
    const playlist = int.options.getString("input");

    let channel = int.member.voice.channel;

    if (!channel)
      return int.reply({
        content: `${this.client.emotes.get(
          "nomic"
        )} You must be in a voice channel to use this command!`,
        ephemeral: true,
      });
    if (int.guild.me.voice.channel && channel !== int.guild.me.voice.channel)
      return int.reply({
        content: `${this.client.emotes.get(
          "nomic"
        )} You must be in the same voice channel as me to use this command!`,
        ephemeral: true,
      });

    let isDJ = data.djRoles.some((r) => int.member._roles.includes(r));
    let isAllowed = data.voiceChannels.find((c) => c === channel.id);

    if (data.voiceChannels.length > 0 && !isAllowed) {
      return int.reply({
        content: `${this.client.emotes.get(
          "nomic"
        )} You must be in one of the allowed voice channels to use this command!`,
        ephemeral: true,
      });
    }

    if (
      channel.members.size > 1 &&
      !isDJ &&
      !int.member.permissions.has("MANAGE_GUILD")
    ) {
      return int.reply({
        content:
          "You must be a DJ or be alone in the voice channel to use this command!",
        ephemeral: true,
      });
    }

    // Spotify regex
    const spotifyPlaylistRegex =
      /^(https?:\/\/)?(www\.)?(open\.spotify\.com)\/playlist\/(.*)$/;
    const spotifyAlbumRegex =
      /^(?:https?:\/\/)?open\.spotify\.com\/album\/([a-zA-Z0-9]{22})(?:\S+)?/;

    // Apple Music regex
    const appleMusicPlaylistRegex =
      /^(https?:\/\/)?(www\.)?(music\.apple\.com)\/(.*)\/playlists\/(.*)$/;
    const appleMusicAlbumRegex =
      /^(https?:\/\/)?(www\.)?(music\.apple\.com)\/(.*)\/album\/(.*)$/;
    // youtube regex
    const youtubePlaylistRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/playlist\?list=(.*)$/;

    // YouTube's music regex
    const youtubeMusicAlbumRegex =
      /^(https?:\/\/)?(music\.youtube\.com)\/playlist\?list=(.*)$/;

    const isPlaylist =
      youtubePlaylistRegex.test(playlist) ||
      youtubeMusicAlbumRegex.test(playlist) ||
      spotifyPlaylistRegex.test(playlist) ||
      spotifyAlbumRegex.test(playlist) ||
      appleMusicPlaylistRegex.test(playlist) ||
      appleMusicAlbumRegex.test(playlist);

    if (!isPlaylist)
      return int.reply({
        content: "That's not a valid playlist link!",
        ephemeral: true,
      });

    let source;
    if (
      spotifyAlbumRegex.test(playlist) ||
      spotifyPlaylistRegex.test(playlist)
    ) {
      source = "spotify";
    } else if (
      appleMusicAlbumRegex.test(playlist) ||
      appleMusicPlaylistRegex.test(playlist)
    ) {
      source = "apple-music";
    } else if (youtubePlaylistRegex.test(playlist)) {
      source = "youtube";
    } else if (youtubeMusicAlbumRegex.test(playlist)) {
      source = "youtube-music";
    } else {
      source = "youtube";
    }

    return this.client.play(
      this.client,
      int,
      data,
      playlist,
      source,
      true,
      false
    );
  }
};
