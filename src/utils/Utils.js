module.exports = class Util {
    constructor(client) {
        this.client = client;
    }

    static formatPerms(perm) {
        return perm
            .toLowerCase()
            .replace(/(^|"|_)(\S)/g, (string) => string.toUpperCase())
            .replace(/_/g, " ")
            .replace(/To/g, "to")
            .replace(/And/g, "and")
            .replace(/Guild/g, "Server")
            .replace(/Tts/g, "Text-to-Speech")
            .replace(/Use Vad/g, "Use Voice Acitvity");
    }

    static formatArray(array, type = "conjunction") {
        return new Intl.ListFormat("en-GB", {style: "short", type: type}).format(
            array
        );
    }

    static removeDuplicates(arr) {
        return [...new Set(arr)];
    }

    static msToSeconds(ms) {
        return parseInt(Math.floor(ms / 1000));
    }

    static secondsToMs(s) {
        return parseInt(s * 1000);
    }

    static readTime(time) {
        let s = time % 60;
        time -= s;
        let m = (time / 60) % 60;
        time -= m * 60;
        let h = (time / 3600) % 24;

        if (m <= 0) {
            return `${s} sec`;
        } else if (h <= 0) {
            return `${m} min`;
        } else {
            return `${h}h`;
        }
    }

    static sourceTest(song) {
        if (!song) throw new Error("You need to give a string to test");

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

        return source;
    }

    static testPlaylist(song) {
        if (!song) throw new Error("You need to give a string to test");

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

        if (youtubePlaylistRegex.test(song) ||
            youtubeMusicAlbumRegex.test(song) ||
            spotifyPlaylistRegex.test(song) ||
            spotifyAlbumRegex.test(song) ||
            appleMusicPlaylistRegex.test(song) ||
            appleMusicAlbumRegex.test(song)) {
            return true;
        }
    }
};
