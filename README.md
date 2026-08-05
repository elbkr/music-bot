<p align="center">
  <a href="https://github.com/elbkr/music-bot">
    <img src="readme/music-bot.png" alt="music-bot" width="350"/>
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D20.11.0-339933?logo=node.js&logoColor=white" alt="Node.js >= 20.11.0"/>
  <img src="https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white" alt="discord.js v14"/>
  <img src="https://img.shields.io/badge/mongoose-v9-880000?logo=mongodb&logoColor=white" alt="Mongoose v9"/>
  <img src="https://img.shields.io/badge/lavalink-v4-fb3c53?logo=youtubemusic&logoColor=white" alt="Lavalink v4"/>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"/>
</p>

---

## Overview

**music-bot** is an enterprise-grade Discord music bot template, built around a strict
3-tier layered architecture and a dedicated Lavalink audio backend rather than in-process
extraction.

It plays from YouTube, YouTube Music, Spotify, Apple Music and SoundCloud; supports both
voice and stage channels; and gives every server independent DJ roles, an allowed-channel
list, and audit logging — all isolated per guild at the database layer, so a single
deployment serves any number of servers.

<img src="readme/splash.png" width="3000" alt="splash">

---

## Key Features

| Capability | Description |
| --- | --- |
| **Multi-source playback** | YouTube, YouTube Music, Spotify, Apple Music and SoundCloud, resolved server-side through Lavalink — no in-process extraction. |
| **Advanced queue management** | Shuffle, jump-to-position, replay, and re-queue the last played track, backed directly by the audio engine's own queue. |
| **Vote-to-skip** | Non-DJ members trigger a majority vote instead of an instant skip. DJs, server managers, and anyone alone with the bot still skip instantly. |
| **DJ roles** | Per-guild configurable roles exempt from vote-to-skip and other playback-restricting guards. |
| **Allowed voice channels** | Optionally restrict playback to a configured allow-list of voice **and stage** channels. |
| **User favorites** | Every user can save, list, remove and replay their own favorite tracks — independent of any single guild. |
| **Custom emoji auto-upload** | Point the bot at a guild and it uploads its full icon set there automatically on first run, falling back to Unicode emoji if unconfigured. |
| **Audit logging** | Configuration changes (DJ roles, allowed channels, announcement toggles) are optionally logged to a channel with the acting user attached. |

---

## Architecture

The codebase enforces a **one-way, 3-tier dependency flow**. Each layer depends only on the
layer beneath it, and none of them know the internal details of the others.

```
Discord Gateway
      │
      ▼
┌──────────────┐   presentation/   Slash commands, event listeners, embeds & buttons
│ Presentation │
└──────┬───────┘
       ▼
┌──────────────┐   domain/         Guards (permissions), emoji & audit-log services
│    Domain    │   player/         Audio engine — AudioPlayerManager, QueueService
└──────┬───────┘
       ▼
┌──────────────┐   database/       Mongoose models & repositories
│   MongoDB    │
└──────────────┘

     ◄── player/AudioPlayerManager.js ──►   Lavalink (external Java server)
                                             via Kazagumo + Shoukaku
```

**Presentation ↔ Domain/Player ↔ Database.** Commands never touch a Mongoose model or the
audio engine's SDK directly — they call into a domain service or a repository, which is the
only code allowed to do either. `AudioPlayerManager.js` is the single file permitted to
import the Lavalink client SDK; everything else reaches playback through `QueueService`,
which also translates the app's own vocabulary (`PlaySource`, `RepeatMode`) into whatever
the audio engine expects, so an engine swap stays contained to one file.

**Guards.** Command authorization is composed from small, single-responsibility guard
classes (`src/domain/guards/`) — `InVoiceChannelGuard`, `DjRoleGuard`,
`LavalinkReadyGuard`, and others — each implementing one `check(interaction, context)` rule.
Commands declare which guards they need instead of hand-rolling permission checks inline.

**External audio engine.** Playback runs on Lavalink, a standalone Java server, so no audio
is decoded or transcoded inside the Node process. Source breakage (e.g. a YouTube extraction
change) gets fixed with a Lavalink plugin update instead of a bot redeploy — see
[`LAVALINK_SETUP.md`](LAVALINK_SETUP.md).

---

## Tech Stack

| Component | Technology |
| --- | --- |
| Runtime | **Node.js** ≥ 20.11.0 (ES Modules) |
| Discord API | **discord.js** v14 |
| Database | **MongoDB** via **Mongoose** v9 |
| Audio server | **Lavalink** v4 |
| Queue layer | **Kazagumo** |
| Lavalink client | **Shoukaku** |

---

## Setup & Installation

### Prerequisites

- **Node.js 20.11.0 or newer**
- A **MongoDB** database — [Atlas](https://www.mongodb.com/atlas) free tier is sufficient
- A **Lavalink v4** server — see [`LAVALINK_SETUP.md`](LAVALINK_SETUP.md) for the full walkthrough
- A **Discord application** with a bot user

### 1. Clone and install

```bash
git clone https://github.com/elbkr/music-bot.git
```

```bash
cd music-bot && npm install
```

### 2. Create the Discord application

1. Open the [Discord Developer Portal](https://discord.com/developers/applications) and create an application.
2. Under **Bot**, create a bot user and copy its **token**.
3. Enable all three **Privileged Gateway Intents** (Presence, Server Members, Message Content).
4. Under **OAuth2**, copy the **Client ID**.
5. Invite the bot using the URL below, replacing `YOUR_CLIENT_ID`:

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=applications.commands%20bot
```

### 3. Configure environment variables

Copy the template and fill in your own values:

```bash
cp .env.example .env
```

```env
TOKEN=your-discord-bot-token
CLIENT_ID=your-discord-application-client-id
MONGO=mongodb+srv://user:password@cluster.mongodb.net/musicbot?retryWrites=true&w=majority
EMOJIS_GUILD_ID=optional-guild-id-for-custom-emoji-auto-upload
```

| Variable | Required | Description |
| --- | :---: | --- |
| `TOKEN` | ✅ | Discord bot token used to authenticate the gateway connection. |
| `CLIENT_ID` | ✅ | Discord application ID, used to register slash commands. |
| `MONGO` | ✅ | MongoDB connection string. |
| `EMOJIS_GUILD_ID` | — | A guild ID the bot can access; enables the custom emoji auto-upload feature. Omit to use built-in Unicode emoji. |

> **Note:** never commit `.env` — it holds credentials that grant full control of your bot.
> Lavalink connection settings live in `lavalink/application.yml`, not `.env` — see
> [`LAVALINK_SETUP.md`](LAVALINK_SETUP.md).

### 4. Set up Lavalink

The bot cannot play audio without a reachable Lavalink node. Follow
**[`LAVALINK_SETUP.md`](LAVALINK_SETUP.md)** for installing Java, downloading Lavalink,
configuring `application.yml` (including Spotify/Apple Music support), and running it
alongside the bot.

### 5. Run

```bash
npm start
```

For development with automatic restarts on file changes:

```bash
npm run dev
```

Lint the project:

```bash
npm run lint
```

The bot registers its slash commands globally on first successful startup — this can take
up to an hour to propagate across all servers the very first time, but is instant on every
subsequent restart where the command set hasn't changed.

---

## Configuration

Once the bot is online, configure it in your server. All configuration commands require the
**Manage Server** permission.

| Command | Description |
| --- | --- |
| `/roles add \| remove \| list` | Manage the DJ roles exempt from vote-to-skip and other playback guards. |
| `/voice add \| remove \| list` | Manage the allowed voice/stage channel list. Empty list = no restriction. |
| `/announce <mode>` | Toggle the "Now playing" message posted when a new track starts. |
| `/log set \| disable` | Set or clear the channel that receives configuration audit-log embeds. |

<p align="center">
  <img src="readme/roles.png" width="330" alt="DJ roles list"/>
  <img src="readme/voice.png" width="330" alt="allowed voice channels list"/>
</p>

### Music commands

| Command | Description | Access |
| --- | --- | --- |
| `/play <input> [source]` | Search or queue a link — YouTube, YouTube Music, Spotify, Apple Music or SoundCloud. | Everyone |
| `/queue` | Show the current track and upcoming queue. | Everyone |
| `/nowplaying` | Show the current track with a live progress bar. | Everyone |
| `/skip` | Skip the current track — instant for DJs, majority vote otherwise. | Everyone |
| `/pause` | Pause or resume playback. | DJ |
| `/stop` | Stop playback and clear the queue. | DJ |
| `/shuffle` | Shuffle the upcoming queue. | DJ |
| `/jump <position>` | Jump to a specific position in the queue. | DJ |
| `/replay` | Restart the current track from `0:00`. | DJ |
| `/last` | Re-queue the previously played track. | Everyone |
| `/loop <mode>` | Set repeat mode — track, queue, or off. | DJ |
| `/volume <value>` | Set the player volume (0-200%). | DJ |
| `/favorite add \| remove \| list \| play` | Manage your personal favorites list. | Everyone |

<p align="center">
  <img src="readme/play.png" width="420" alt="/play"/>
  <img src="readme/nowplaying.png" width="420" alt="/nowplaying"/>
</p>
<p align="center">
  <img src="readme/queue.png" width="330" alt="/queue"/>
  <img src="readme/playlist.png" width="330" alt="queueing a playlist"/>
</p>
<p align="center">
  <img src="readme/voice-channel.png" width="260" alt="voice channel support"/>
  <img src="readme/stage-channel.png" width="260" alt="stage channel support"/>
</p>

---

## Project Structure

```
src/
├── client/          Bot composition root — wires every subsystem together
├── presentation/     Discord-facing layer
│   ├── commands/     Slash commands, grouped by domain (music, config, favorite)
│   ├── components/   Embeds and pagination buttons
│   └── events/        Gateway event listeners
├── domain/           Cross-cutting business rules
│   ├── guards/        Permission/state checks (DJ role, voice channel, Lavalink readiness…)
│   ├── services/       Emoji and audit-log services
│   └── constants/      Theme colors, emoji names
├── player/           Audio engine — the only layer allowed to import the Lavalink SDK
│   ├── events/         Playback lifecycle listeners (track start, error, empty queue…)
│   └── constants/       PlaySource / RepeatMode — the app's own vocabulary
├── database/         All MongoDB access
│   ├── models/          Mongoose schemas
│   ├── repositories/    Query/write access — the only layer that imports a model
│   └── cache/            Bounded, TTL'd guild-config cache
└── shared/           Generic utilities — logger, env loader, formatters
```

---

## Contributing

Contributions are welcome.

1. Fork the repository and create a feature branch.
2. Make your changes, keeping to the existing layer boundaries — business logic and audio
   control belong in `domain`/`player`, database access in `database/repositories`, and
   rendering in `presentation/components`.
3. Ensure `npm run lint` passes cleanly.
4. Open a pull request describing what changed and why.

---

## License

Released under the [MIT License](LICENSE).

<p align="center">
  <a href="https://www.jetbrains.com/community/opensource/#support">
    <img src="readme/jb_beam.png" alt="JetBrains" width="25"/>
  </a>
  Thanks to <a href="https://www.jetbrains.com/community/opensource/#support">JetBrains</a> for providing a free license for developing this project.
</p>
