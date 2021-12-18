module.exports = class Play extends Interaction {
  constructor() {
    super({
      name: "play",
      description: "Adds a song to the queue",
      options: [
        {
          type: "3",
          name: "input",
          description: "The search term or a link",
          required: true,
        },
        {
          type: "5",
          name: "force",
          description: "Directly play the song",
          required: false,
        },
      ],
    });
  }

  async exec(int, data) {
    const song = int.options.getString("input");
    const force = int.options.getBoolean("force");

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
      force &&
      members.size > 1 &&
      !isDJ &&
      !int.member.permissions.has("MANAGE_GUILD")
    ) {
      return int.reply({
        content:
          "You must be a DJ or be alone in the voice channel to use the force function!",
        ephemeral: true,
      });
    }

    // Spotify regex
    const spotifyTrackRegex =
      /^(https?:\/\/)?(www\.)?(open\.spotify\.com\/track\/)(.*)$/;
    const spotifyPlaylistRegex =
      /^(https?:\/\/)?(www\.)?(open\.spotify\.com)\/playlist\/(.*)$/;
    const spotifyAlbumRegex =
      /^(?:https?:\/\/)?open\.spotify\.com\/album\/([a-zA-Z0-9]{22})(?:\S+)?/;

    // Apple Music regex
    const appleMusicPlaylistRegex =
      /^(https?:\/\/)?(www\.)?(music\.apple\.com)\/(.*)\/playlists\/(.*)$/;
    const appleMusicAlbumRegex =
      /^(https?:\/\/)?(www\.)?(music\.apple\.com)\/(.*)\/album\/(.*)$/;
    const appleMusicTrackRegex =
      /^(https?:\/\/)?(www\.)?(music\.apple\.com)\/(.*)\/(.*)\/(.*)$/;

    // youtube regex
    const youtubePlaylistRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/playlist\?list=(.*)$/;
    const youtubeVideoRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/watch\?v=(.*)$/;

    // YouTube's music regex
    const youtubeMusicAlbumRegex =
      /^(https?:\/\/)?(music\.youtube\.com)\/playlist\?list=(.*)$/;
    const youtubeMusicTrackRegex =
      /^(https?:\/\/)?(music\.youtube\.com)\/watch\?v=(.*)$/;

    const isPlaylist =
      youtubePlaylistRegex.test(song) ||
      youtubeMusicAlbumRegex.test(song) ||
      spotifyPlaylistRegex.test(song) ||
      spotifyAlbumRegex.test(song) ||
      appleMusicPlaylistRegex.test(song) ||
      appleMusicAlbumRegex.test(song);

    let source;
    if (
      spotifyTrackRegex.test(song) ||
      spotifyAlbumRegex.test(song) ||
      spotifyPlaylistRegex.test(song)
    ) {
      source = "spotify";
    } else if (
      appleMusicTrackRegex.test(song) ||
      appleMusicAlbumRegex.test(song) ||
      appleMusicPlaylistRegex.test(song)
    ) {
      source = "apple-music";
    } else if (
      youtubeVideoRegex.test(song) ||
      youtubePlaylistRegex.test(song)
    ) {
      source = "youtube";
    } else if (
      youtubeMusicTrackRegex.test(song) ||
      youtubeMusicAlbumRegex.test(song)
    ) {
      source = "youtube-music";
    } else {
      source = "youtube";
    }

    if (isPlaylist) {
      return this.client.play(
        this.client,
        int,
        data,
        song,
        source,
        true,
        false,
        false,
        false
      );
    } else {
      return this.client.play(
        this.client,
        int,
        data,
        song,
        source,
        false,
        false,
        false,
        force
      );
    }
  }
};
