# Lavalink Setup Guide

Audio extraction, transcoding, and streaming all happen in **Lavalink**, a standalone Java
server the bot talks to over WebSocket + REST — the bot process itself never decodes or
downloads audio.

**The bot will start without Lavalink, but every music command will refuse with
"I can't reach my audio server."** That's intentional — `LavalinkReadyGuard` checks node
availability before any playback command runs, so a missing server produces one clear
message instead of confusing downstream errors.

---

## The 3-Console Rule

Running this bot locally means **three independent processes running at the same time**,
each in its own terminal. None of them are optional — `application.yml` has
`plugins.lavasrc.spotify.preferPartnerApi` permanently enabled (see step 4b), so
`spotify-tokener` isn't a fallback for when something breaks, it's a standing dependency of
every Spotify request Lavalink makes:

| # | Process | Command | Terminal stays open? |
|---|---|---|---|
| 1 | **spotify-tokener** | `docker compose -f docker-compose.spotify-tokener.yml up -d` (repo root) | No — `-d` detaches it |
| 2 | **Lavalink** | `java -jar Lavalink.jar` (run from the `lavalink/` folder) | Yes — it's a server |
| 3 | **The bot** | `npm start` | Yes — it's a long-running process |

Start them in that order — token service, then audio server, then bot — since Lavalink
reaches out to `spotify-tokener` the moment it needs a Spotify token, and the bot needs
Lavalink up before `LavalinkReadyGuard` will let any music command through.

This assumes a MongoDB connection the bot can just dial into (a hosted cluster, e.g. Atlas)
rather than a database you also have to start locally — see the main
[README](README.md#setup--installation) for `.env` and MongoDB connection details. If your
own setup runs MongoDB locally too, that's a fourth console; this guide only covers the
audio stack.

---

## 1. Install Java

Lavalink v4 requires **Java 17 or newer** (Java 21 LTS is a good default).

```bash
java -version
```

You need `openjdk version "17"` or higher. If not installed, get a build from
[Adoptium (Eclipse Temurin)](https://adoptium.net/) — pick the **JDK 21 LTS** installer for
Windows x64, and tick "Set JAVA_HOME variable" during setup.

---

## 2. Download Lavalink

Create a folder to hold the server (keep it outside the bot repo, or in a gitignored
subfolder — the jar is ~100MB):

```bash
mkdir lavalink
```

Download **Lavalink.jar v4.2.2** (latest as of this writing) from the official releases:

<https://github.com/lavalink-devs/Lavalink/releases/download/4.2.2/Lavalink.jar>

Or via PowerShell:

```bash
curl -L -o lavalink/Lavalink.jar https://github.com/lavalink-devs/Lavalink/releases/download/4.2.2/Lavalink.jar
```

Check the [releases page](https://github.com/lavalink-devs/Lavalink/releases) for anything
newer.

---

## 3. Configure `application.yml`

Lavalink reads `application.yml` from its **working directory** — it lives at
`lavalink/application.yml`, next to `lavalink/Lavalink.jar`.

> **This file is a tracked template, not a local secret.** `lavalink/application.yml` is
> committed to the repository on purpose, with placeholder values (`YOUR_SPOTIFY_CLIENT_ID`,
> `YOUR_SPOTIFY_CLIENT_SECRET`) wherever real credentials would normally go — it is **not**
> in `.gitignore`. That's deliberate: everything in it except your own Spotify credentials
> (step 4) is shared, non-secret configuration (plugin versions, source toggles, filters),
> so checking it in gives every contributor a working baseline out of the box instead of
> reverse-engineering it from scratch. Fill in your own Spotify credentials locally, but
> don't feel obligated to keep that edit out of a fork — they're free, personal API
> credentials, not a production secret (see step 4). If you ever do need a genuinely
> per-environment secret here, copy the file to `application.local.yml`, gitignore *that*,
> and point Lavalink at it with `-Dspring.config.location=`.

Two plugins matter here, and neither is optional for this bot:

- **`youtube-plugin`** — Lavalink v4 removed YouTube from core. Without this, YouTube
  doesn't work *and* Spotify doesn't either, because Spotify tracks are mirrored to
  YouTube for actual playback.
- **`lavasrc-plugin`** — adds Spotify / Apple Music / Deezer. Lavalink core has **no
  Spotify support at all**. Since your main use case is Spotify playlists, this is
  required, not a nice-to-have.

```yaml
server:
  port: 2333
  address: 0.0.0.0

lavalink:
  plugins:
    # YouTube support — removed from Lavalink core in v4, must be added back.
    - dependency: "dev.lavalink.youtube:youtube-plugin:1.18.2"
      repository: "https://maven.lavalink.dev/releases"
      snapshot: false
    # Spotify / Apple Music / Deezer support.
    - dependency: "com.github.topi314.lavasrc:lavasrc-plugin:4.8.3"
      repository: "https://maven.lavalink.dev/releases"
      snapshot: false

  server:
    password: "youshallnotpass"
    sources:
      # MUST be false — the youtube-plugin above replaces the deprecated
      # built-in source. Leaving this true causes conflicts.
      youtube: false
      bandcamp: true
      soundcloud: true
      twitch: true
      vimeo: true
      http: true
      local: false
    filters:
      volume: true
      equalizer: true
      karaoke: true
      timescale: true
      tremolo: true
      vibrato: true
      distortion: true
      rotation: true
      channelMix: true
      lowPass: true
    bufferDurationMs: 400
    frameBufferDurationMs: 5000
    opusEncodingQuality: 10
    resamplingQuality: LOW
    trackStuckThresholdMs: 10000
    useSeekGhosting: true
    youtubePlaylistLoadLimit: 6
    playerUpdateInterval: 5
    youtubeSearchEnabled: true
    soundcloudSearchEnabled: true

plugins:
  youtube:
    enabled: true
    allowSearch: true
    allowDirectVideoIds: true
    allowDirectPlaylistIds: true
    # Client order matters. MUSIC first gives YouTube Music results (official
    # audio) rather than music videos / remixes / extended edits — the same
    # accuracy goal we were chasing before the pivot, now handled server-side.
    clients:
      - MUSIC
      - ANDROID_VR
      - WEB
      - WEBEMBEDDED

  lavasrc:
    sources:
      spotify: true
      applemusic: true
      deezer: false
      yandexmusic: false
      flowerytts: false
      youtube: true
    providers:
      # How a Spotify/Apple Music track is resolved into a playable stream.
      # ytmsearch first keeps playback on YouTube Music (official audio).
      - "ytmsearch:\"%ISRC%\""
      - "ytmsearch:%QUERY%"
      - "ytsearch:\"%ISRC%\""
      - "ytsearch:%QUERY%"
    spotify:
      # See step 4 — playlists will NOT load until these are filled in.
      clientId: "YOUR_SPOTIFY_CLIENT_ID"
      clientSecret: "YOUR_SPOTIFY_CLIENT_SECRET"
      countryCode: "US"
      playlistLoadLimit: 6
      albumLoadLimit: 6
      # See step 4b — required as of Spotify's Feb 2026 API change, or
      # playlist links 401 even with valid clientId/clientSecret above.
      preferPartnerApi: true
      customTokenEndpoint: "http://localhost:8080/api/token"
    applemusic:
      countryCode: "US"
      playlistLoadLimit: 6
      albumLoadLimit: 6

logging:
  level:
    root: INFO
    lavalink: INFO
  file:
    path: ./logs/
```

---

## 4. Get Spotify API credentials

LavaSrc reads Spotify **metadata** through Spotify's official API, so it needs your own
app credentials. This is free and takes about two minutes.

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and log in.
2. **Create app** → give it any name/description → set Redirect URI to
   `http://localhost:8888/callback` (unused, but required) → check the API terms box → **Save**.
3. Open the app → **Settings** → copy the **Client ID**, then **View client secret** and copy that.
4. Paste both into the `plugins.lavasrc.spotify` block in `application.yml`.

> Without valid credentials, Spotify links fail to load and the bot's circuit breaker will
> stop playback after 3 consecutive failures — which is the expected, non-spammy failure.

---

## 4b. Run `spotify-tokener` (required for Spotify)

**Spotify changed their platform in February 2026:** playlist and metadata endpoints moved
off the Client Credentials flow entirely. Valid `clientId`/`clientSecret` from step 4 are
still required (search still needs them), but they're **no longer sufficient for playlist
reads** — without this step, Spotify playlist links fail with this in the Lavalink console:

```
Server responded with an error to '...spotify.com/v1/playlists/.../items...':
{"error": {"status": 401, "message": "Valid user authentication required"}}
```

This is a Spotify-side restriction, not a config mistake — your account's Premium status is
unrelated (that governs playback, not this app-level API access).

**Fix:** LavaSrc's `preferPartnerApi` option (already set in the `application.yml` above)
routes Spotify requests through the same internal API the Spotify web player itself uses, via
[`spotify-tokener`](https://github.com/topi314/spotify-tokener) — an official companion
tool from LavaSrc's own maintainer, not a third-party scraper. Since `preferPartnerApi` is
always on, this isn't optional — it's Console 1 from the 3-Console Rule above.

The repo already includes [`docker-compose.spotify-tokener.yml`](docker-compose.spotify-tokener.yml)
at its root — no need to write your own:

```bash
docker compose -f docker-compose.spotify-tokener.yml up -d
```

No Docker? Requires Go 1.24+ and Chrome installed:

```bash
go install github.com/topi314/spotify-tokener@master
spotify-tokener
```

Either way, it listens on `http://localhost:8080/api/token`, matching the
`customTokenEndpoint` already set in `application.yml`. **Start `spotify-tokener` before
Lavalink**, then retry the playlist link — no bot or Lavalink restart needed beyond
Lavalink's own restart to pick up the `application.yml` change.

---

## 5. Start all three processes

This is the 3-Console Rule from the top of this guide, made concrete.

**Console 1 — `spotify-tokener`**, from the repo root:

```bash
docker compose -f docker-compose.spotify-tokener.yml up -d
```

This detaches (`-d`), so the container keeps running in the background — you don't need to
keep this terminal open once it's up. Confirm it's running with `docker compose -f
docker-compose.spotify-tokener.yml ps`.

**Console 2 — Lavalink**, from inside the `lavalink/` folder:

```bash
java -jar Lavalink.jar
```

First launch downloads the plugins from Maven, so it takes a minute and needs internet
access. You're ready when you see something like:

```
Lavalink is ready to accept connections.
```

Leave this terminal running — it's a server, not a one-shot command.

**Console 3 — the bot**, from the repo root:

```bash
npm start
```

You should see the bot log both connections coming up:

```
[Database] Connected to MongoDB (latency: 12ms)
[Lavalink] Lavalink node "main" connected.
```

`spotify-tokener` runs detached in the background; Lavalink and the bot stay in the
foreground of their own terminals for as long as they're running.

---

## 6. Bot-side configuration (optional)

The bot defaults to `localhost:2333` with password `youshallnotpass`, matching the
`application.yml` above — no `.env` changes are needed for local development.

To point at a different or remote node, add any of these to `.env`:

```bash
LAVALINK_HOST=localhost
LAVALINK_PORT=2333
LAVALINK_PASSWORD=youshallnotpass
LAVALINK_SECURE=false
LAVALINK_NAME=main
```

Set `LAVALINK_SECURE=true` when connecting to a hosted node over `wss://`/`https://`.

> If you change `password` in `application.yml`, you **must** change `LAVALINK_PASSWORD` to
> match, or the node will reject the connection with a 401.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Bot says "I can't reach my audio server" | Lavalink isn't running, or host/port/password mismatch. Check the Lavalink terminal. |
| `[Lavalink] node "main" error: Unexpected server response: 401` | Password mismatch between `application.yml` and `LAVALINK_PASSWORD`. |
| Lavalink exits immediately with `UnsupportedClassVersionError` | Java version too old — needs 17+. Run `java -version`. |
| Port 2333 already in use | Another Lavalink instance is running, or change `server.port` and `LAVALINK_PORT` together. |
| Spotify links load nothing | Missing/invalid Spotify `clientId`/`clientSecret` in `application.yml`. |
| Spotify playlist 401 "Valid user authentication required" | Spotify's Feb 2026 API change — see step 4b. Console 1 (`spotify-tokener`) isn't running. |
| Lavalink logs a connection refused to `localhost:8080` | Console 1 (`spotify-tokener`) isn't up yet, or was started after Lavalink already tried a Spotify request — restart Lavalink once it's up. |
| YouTube tracks fail to load | Update `youtube-plugin` to the newest version and restart Lavalink. This is now a **server-side** fix — no bot code changes or redeploys. |
| Playback stops after 3 failed tracks | Working as designed — the circuit breaker in `src/player/events/support.js`. Check the Lavalink logs for the underlying cause. |

### Keeping YouTube working long-term

YouTube periodically breaks third-party extraction. Under the old in-process setup that
meant the bot itself was broken until a dependency shipped a fix. Now it's a server-side
plugin bump:

1. Check [youtube-source releases](https://github.com/lavalink-devs/youtube-source/releases).
2. Update the version in `application.yml`.
3. Restart Lavalink.

The bot doesn't change, doesn't redeploy, and doesn't even need to restart.
