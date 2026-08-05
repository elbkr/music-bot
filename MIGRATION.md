# Migration to the new architecture

## ✅ Migration complete (2026-08-02)

Every item that gated legacy deletion is checked off. The legacy `src/{struct,commands,
events,player,models,utils}` tree and every dead dependency have been **deleted**, not just
marked safe to delete. `npm audit` reports **0 vulnerabilities** (down from 18 at the start
of the Lavalink pivot). This file is now a historical record of *why* the architecture looks
the way it does, kept for onboarding and future-you, not an active deletion gate.

**Final directory structure:**

```
src/
├── client/           Bot.js — composition root, wires every subsystem together
├── database/         Mongoose models, repositories, cache — everything that talks to MongoDB
│   ├── cache/
│   ├── models/
│   └── repositories/
├── domain/           Cross-cutting business rules that aren't audio-specific
│   ├── constants/     Emojis.js, Theme.js
│   ├── guards/         command access-control (voice channel, DJ role, permissions)
│   └── services/        EmoteService, LogService
├── player/            The entire audio subsystem, self-contained
│   ├── constants/       PlaySource, RepeatMode
│   ├── events/            Kazagumo/Shoukaku lifecycle listeners
│   ├── AudioPlayerManager.js
│   └── QueueService.js
├── presentation/      Everything Discord-facing
│   ├── commands/         one folder per command category + CommandRegistry
│   ├── components/        embeds, buttons
│   └── events/              guild/voice-state listeners + EventRegistry
└── shared/            Generic, non-domain utilities
    ├── config/           env.js
    ├── format/            duration.js, track.js
    └── logger/             Logger.js
```

**Final dependencies (9, down from 20+):** `bufferutil`, `chalk`, `discord.js`, `dotenv`,
`kazagumo`, `moment`, `mongoose`, `shoukaku`, `utf-8-validate`.

---

## ⚠️ Architectural pivot: discord-player → Lavalink (2026-08-01)

**The entire in-process audio stack was removed.** Audio is now handled by
[Lavalink](https://lavalink.dev) — a standalone Java server — via
[Kazagumo](https://github.com/Takiyo0/Kazagumo) (queue layer) on top of
[Shoukaku](https://github.com/shipgirlproject/Shoukaku) (Lavalink client).

**Why:** every audio failure in this project traced back to the same root cause — doing
YouTube extraction inside the Node process. `discord-music-player` → `ytdl-core` broke;
`discord-player` dropped YouTube entirely; `discord-player-youtubei` hit signature-decipher
failures. Each fix required new bot code and a redeploy. With Lavalink, extraction lives in
a server-side plugin: when YouTube breaks, you bump a version in `application.yml` and
restart the server. **The bot doesn't change.** That's the durable property that no
in-process library could offer.

**Removed during the pivot:** `discord-player`, `@discord-player/extractor`,
`discord-player-youtubei`, `ffmpeg-static`, `youtube-dl-exec`.
**Added:** `kazagumo`, `shoukaku`.

**Operational consequence:** the bot has an external runtime dependency. It starts fine
without Lavalink, but all music commands refuse with a clear message via
`LavalinkReadyGuard`. **See [LAVALINK_SETUP.md](LAVALINK_SETUP.md)** — it covers Java, the
jar, a complete `application.yml`, the YouTube plugin (removed from Lavalink v4 core), and
LavaSrc (required for Spotify — Lavalink core has no Spotify support at all).

Verified versions at time of writing: Lavalink `4.2.2`, `dev.lavalink.youtube:youtube-plugin`
`1.18.2`, `com.github.topi314.lavasrc:lavasrc-plugin` `4.8.3`.

---

## Environment / dependency notes (historical)

> These document problems in the audio stack that has since been removed, and the
> subsequent Phase 7 dependency cleanup. Kept because they explain *why* the codebase looks
> the way it does.

- **Spotify playlist 401s (2026-08-01, external, not a bot bug).** Spotify's February 2026
  API change moved playlist/metadata endpoints off the Client Credentials flow, so
  LavaSrc's `clientId`/`clientSecret` alone now 401 on playlist reads regardless of
  validity. Fixed server-side in `lavalink/application.yml` (`preferPartnerApi: true` +
  `customTokenEndpoint`), which requires running
  [`spotify-tokener`](https://github.com/topi314/spotify-tokener) alongside Lavalink. Full
  setup in [LAVALINK_SETUP.md](LAVALINK_SETUP.md) step 4b.
- **`discord-api-types` version collision (fixed 2026-07-31, override removed 2026-08-02).**
  `discord-player`'s voice engine, `discord-voip@7.2.0`, imported `discord-api-types/voice/v8`
  but didn't declare `discord-api-types` in its own `package.json`. npm was hoisting the old
  `discord-api-types@0.36.3` (satisfying legacy `@discordjs/voice@0.11.0`'s `voice/v4.js`
  need) to the top level, and `discord-voip` silently fell through to that wrong copy.
  Fixed at the time with a `package.json` `overrides` entry. **Verified during the Phase 7
  purge that the override is no longer needed at all** — with `discord-music-player` (the
  only consumer that ever needed the old `0.36.x` range) deleted, only one
  `discord-api-types@0.38.52` resolves anywhere in the tree, and `discord-voip` resolves
  `voice/v8.js` correctly without any override. Removed it rather than leave dead
  configuration behind.
- **`@discordjs/opus` native binary was never buildable on this machine** (no Visual Studio
  C++ toolchain). Installs were run with `--ignore-scripts` to route around it for months.
  **Resolved by deletion, not by fixing the build** — Lavalink does all Opus encoding
  server-side, so the new pipeline never needed this package. Its removal in the Phase 7
  purge is also why a plain `npm install` (no flags, no workarounds) now succeeds cleanly.
- **`@snazzah/davey` (DAVE protocol E2EE) — found dead and removed in the Phase 7 purge.**
  This was only ever needed by `@discordjs/voice` during the brief discord-player era (fixed
  2026-07-31, see below); Shoukaku doesn't use `@discordjs/voice` and never depended on it.
  It survived the Lavalink pivot unnoticed because the pivot happened in a later session
  than when this package was added — a good example of why a dependency audit at the end of
  a migration catches things a step-by-step one misses.
- **FFmpeg / no YouTube extractor / signature decipher failures / logging cleanup** — all
  discord-player-era problems, fully moot since that engine was removed. Full history
  preserved in git blame on this file if needed; trimmed here since none of it describes
  the current system anymore.

---

## Commands (`presentation/commands/`)

- [x] `music/play.js` → [`PlayCommand`](src/presentation/commands/music/PlayCommand.js)
      *(force-play flag not ported — superseded by vote-to-skip's DJ bypass)*. Optional
      `source` choice (YouTube Music/YouTube/SoundCloud/Spotify/Apple Music).
- [x] `music/skip.js` → [`SkipCommand`](src/presentation/commands/music/SkipCommand.js) —
      **majority vote-to-skip implemented** (see Player subsystem below). DJ Guild
      Manager/alone-in-channel still skip instantly.
- [x] `music/volume.js`, `music/loop.js`, `music/replay.js`, `music/last.js`,
      `music/jump.js`, `music/stop.js`, `music/pause.js`, `music/queue.js`,
      `music/nowplaying.js`, `music/shuffle.js` — all migrated, see prior phases for
      individual notes (still accurate, only import paths moved).
- [x] `config/roles.js`, `config/voice.js`, `config/announce.js` — migrated with
      `ManageGuildGuard`, ephemeral embed replies, audit-log wiring.
- [x] `config/log.js` (new, no legacy equivalent) → `LogCommand` — audit log channel config.
- [x] `favorite/favorite.js` → [`FavoriteCommand`](src/presentation/commands/favorite/FavoriteCommand.js) —
      **built in Phase 7.** `add`/`remove`/`list`/`play` subcommands. Deliberately does
      **not** extend `MusicCommand` — only `play` needs voice guards (reused as plain
      instances, not a blocking guard chain), since gating `add`/`list`/`remove` on being in
      a voice channel would be a regression from legacy behavior (managing your own
      favorites list shouldn't require being in a channel). Whole command is ephemeral
      (favorites are personal), but `/favorite play` still triggers the normal **public**
      "Now playing" announcement via `onPlayerStart` — only the command's own confirmation
      reply is private. Stores `{title, author, uri, source}` per favorite (richer than
      legacy's `{name, url}`) and de-duplicates by `uri`, not title, since two different
      versions of a same-titled song are different tracks.
- [ ] `music/search.js` — not built. Deferred; needs the autocomplete infrastructure
      described under Planned features below.
- [ ] `music/playlist.js` — not built. Distinct, larger feature from favorites (named,
      multi-track, shareable playlists vs. a personal single-track list) — not requested in
      Phase 7, not started.

## Guards (`domain/guards/`)

All guards from prior phases unchanged (`InVoiceChannelGuard`, `SameVoiceChannelGuard`,
`AllowedVoiceChannelGuard`, `LavalinkReadyGuard`, `DjRoleGuard`, `ManageGuildGuard`) — see
git history for individual rationale, still accurate.

- [x] **Vote-to-skip — implemented without a new guard.** `DjRoleGuard` is deliberately
      **not** in `SkipCommand.extraGuards` anymore: as a blocking guard it would reject
      non-DJ members before `exec()` ever runs, leaving no code path for them to vote at
      all. Instead `SkipCommand` calls `djRoleGuard.check()` directly as a plain bypass
      check — DJ/Manage Guild/alone-in-channel skips instantly (unchanged), anyone else
      falls through to `QueueService.registerSkipVote()`. Same "call a guard's `check()`
      directly, not as a blocking gate" pattern `FavoriteCommand`'s `play` subcommand also
      uses, now established twice.

## Player subsystem (`player/`) — moved and expanded in Phase 7

Previously split across `domain/services/{AudioPlayerManager,QueueService}.js` and
`domain/player-events/`. **Consolidated into its own top-level `player/` folder** — audio is
the single largest, most self-contained subsystem in the app (matches how the legacy
`discord-music-player`-era code was organized under `src/player/`, now rebuilt for
Lavalink/Kazagumo instead). `PlaySource`/`RepeatMode` moved with it — they're audio-only
vocabulary, unlike `Emojis`/`Theme` which stayed in `domain/constants/` as genuinely
cross-cutting concerns.

- [x] [`AudioPlayerManager.js`](src/player/AudioPlayerManager.js) — owns the single Kazagumo
      instance and node config. The only file allowed to import `kazagumo`/`shoukaku`.
- [x] [`QueueService.js`](src/player/QueueService.js) — `play`, `skip`, `setVolume`,
      `setRepeatMode`, `seek`, `previous`, `pause`/`resume`/`isPaused`, `jump`, `stop`,
      `getCurrentTrack`, `getUpcomingTracks`, `getPlaybackPosition`,
      `scheduleEmptyChannelDisconnect`/`cancelEmptyChannelDisconnect`. All verified against
      the installed Kazagumo/Shoukaku source, not just docs (docs have been wrong before in
      this project — e.g. `seek()`'s JSDoc claims seconds, the implementation uses ms).
- [x] **`registerSkipVote(guildId, userId, voiceChannel)` — new in Phase 7.** Majority vote
      (`ceil(nonBotMembers / 2)`, so 2 members needs 1 vote, 3 needs 2) stored as a `Set` of
      user IDs on `player.data` (one vote per user regardless of how many times they run
      `/skip`), cleared by `onPlayerStart` on every track change so votes never leak into
      the next song. Verified against the real `QueueService` with a live simulation:
      duplicate votes from the same user don't double-count, and the threshold correctly
      triggers `player.skip()` on the deciding vote.
- [x] `player/constants/{PlaySource,RepeatMode}.js` — our own vocabulary, translated to the
      engine's by `QueueService` alone, so a future engine swap doesn't ripple into
      commands (this already proved its worth once, during the Lavalink pivot).
- [x] `player/events/` (was `domain/player-events/`) — `onPlayerStart`, `onPlayerEmpty`,
      `onPlayerClosed`, `onPlayerDestroy`, `onPlayerException`/`onPlayerStuck`/
      `onPlayerResolveError` (circuit breaker), `nodeEvents.js`, `support.js`. All content
      unchanged from prior phases, only relocated — see git history for the original
      per-handler rationale (still accurate).
- [x] `onPlayerStart.js` — gained `resetSkipVotes(player)` alongside the existing
      `resetErrorStreak(player)` call, using the same `player.data`-key-constant pattern
      `support.js` already established for the circuit breaker (`SKIP_VOTES_KEY`, exported
      once, imported by both `QueueService` and `onPlayerStart`).

## Guild/client events (`presentation/events/`)

- [x] Event-loading infrastructure (`base/Event.js` + `EventRegistry.js`), `voiceStateUpdate.js`,
      `channelDelete.js`, `roleDelete.js` — unchanged from prior phase.
- [x] `guildCreate.js` — **built in Phase 7.** Log-only; `GuildRepository.findOrCreate`
      being lazy means there's genuinely nothing else to do on join.
- [x] `guildDelete.js` — **built in Phase 7.** Calls `guildRepository.invalidate(guildId)`
      — the exact fix this file has been tracking as pending since the events infrastructure
      was built. **Deliberately does not delete the guild's Mongo document** — a kick is
      often accidental or temporary, and wiping DJ roles/allowed channels/log channel on
      every kick would be a worse default than a config that's merely unused until the bot
      is re-added. Invalidating the cache is what actually fixes the drift bug the original
      audit flagged (stale cached data surviving a kick); deleting the config is a separate,
      more destructive decision this doesn't make unilaterally.
- [ ] Formalizing the inline `interactionCreate` listener in `client/Bot.js` into its own
      `EventRegistry`-loaded file remains deferred — it's still exactly one job (route
      chat-input commands to `command.run()`), so the original "if/when it grows" condition
      hasn't triggered.
- [ ] `clientUndeafen.js` — still no equivalent event in Kazagumo/Shoukaku. Still an open
      decision, not a silent drop.

## Database layer (`database/`) — restructured in Phase 7

**Merged `repository/` into `database/`** — both were "the code that owns persistence," and
having `connect.js` in one top-level folder while models/repositories/cache lived in a
separate `repository/` folder split one concern across two folders for no reason. `Guild.model.js`/
`GuildRepository.js`/`BoundedGuildCache.js` moved with **zero internal import changes** —
their relative paths to each other were already correct once both ended up under the same
new parent.

- [x] [`Guild.model.js`](src/database/models/Guild.model.js), [`GuildRepository.js`](src/database/repositories/GuildRepository.js) —
      `findOrCreate` + `addDjRole`/`removeDjRole`/`addVoiceChannel`/`removeVoiceChannel`/
      `setAnnouncements`/`setLogChannel`, all `{ ok, doc }`.
- [x] [`User.model.js`](src/database/models/User.model.js) — **new in Phase 7.** Stores
      `favorites: [{title, author, uri, source, addedAt}]` per user, pinned to the `users`
      collection (same reasoning as `Guild.model.js`'s explicit collection name — matches
      where the legacy `model("Users", ...)` resolved to).
- [x] [`UserRepository.js`](src/database/repositories/UserRepository.js) — **new in Phase 7.**
      `findOrCreate`, `listFavorites`, `addFavorite` (dedupes by `uri`), `removeFavorite`
      (1-indexed, matching what `/favorite list` displays). No `BoundedGuildCache`-style
      cache — favorites are read/written far less often than guild config, not worth the
      staleness/memory tradeoff a cache exists to solve.
- [x] [`BoundedGuildCache.js`](src/database/cache/BoundedGuildCache.js) — unchanged,
      relocated.
- [x] [`connect.js`](src/database/connect.js) — unchanged except its `Logger` import path
      (moved to `shared/logger/`).

## Configuration audit logs (`domain/services/LogService.js`)

Unchanged from prior phase — `Guild.model.js`'s `logChannelId`, `LogCommand`,
`LogService.send()`, `AuditLogEmbed.js`, wired into every config mutation. No path changes;
`LogService.js` stayed in `domain/services/` since it isn't audio-specific.

## Emote system (`domain/services/EmoteService.js`)

Unchanged from prior phase — by-name lookup from a designated guild, auto-upload of missing
icons, Unicode fallback when unconfigured. No path changes; `EmoteService.js` stayed in
`domain/services/` for the same reason `LogService.js` did.

## Presentation components

- [x] Pagination, `NowPlayingEmbed`, `QueueEmbed`, `SongAddedEmbed`, `PlaylistAddedEmbed`,
      `ConfigReplyEmbed`, `AuditLogEmbed` — unchanged from prior phases.
- [x] [`FavoritesEmbed.js`](src/presentation/components/embeds/FavoritesEmbed.js) — **new
      in Phase 7.** Paginated list of a user's favorites, reuses `formatTrackTitle()`
      unmodified since favorite subdocuments carry the same `{title, author}` shape
      `KazagumoTrack` does.
- [ ] Persistent player control buttons (play/pause/skip/stop on the now-playing embed) —
      **explicitly deferred again this phase**, per instruction not to build the
      self-updating dashboard yet. Still tracked under Planned features below.

### Visual polish

Unchanged from prior phase — `Theme.js`, `formatTrackTitle()`, ephemeral config replies. No
new work this phase.

## Open design decisions

- [x] **`Utils.sourceTest`/`testPlaylist` — resolved by deletion, not migration.** The
      entire legacy `src/utils/Utils.js` (along with `Types.js`, `Pagination.js`) was
      deleted in the Phase 7 purge after confirming zero references anywhere in the new
      architecture. Nothing to migrate — Lavalink/LavaSrc auto-detect source and playlist
      type server-side, this logic was never needed here.
- [x] Emote system, duration formatting — resolved in prior phases, unchanged.

## Planned features (not started — still requires explicit go-ahead)

- [ ] **`/search` with Discord's native autocomplete.** Unchanged assessment from prior
      phase — needs a `Command.autocomplete()` hook and a new `isAutocomplete()` branch in
      the interaction router. Recommended, not started.
- [ ] **Self-updating pinned "dashboard" message in a dedicated music channel.**
      **Explicitly deferred again this phase** per instruction. Unchanged assessment: build
      in three independent steps (persistent now-playing message + buttons in any channel,
      then the dedicated/cleared channel restriction, then the stray-message purge sweep),
      not as one PR.
- [ ] Emoji suggestions (`dj`, `settings`/`gear`, `log`/`scroll`, `pin`/`next`/`previous`,
      `offline`/`noaudio`, `success`/`warning`/`error`) — unchanged from prior phase, still
      just suggestions, no image assets to add them with.

---

## Phase 7 summary

Everything gating legacy deletion is now done:

1. **User favorites** — full model/repository/command stack, richer than the legacy
   `{name, url}` shape, deduped by URI.
2. **Vote-to-skip** — majority vote for non-DJ members, verified with a live simulation
   against the real `QueueService`, not just read for correctness.
3. **Directory restructuring** — `player/` (audio, self-contained) and `database/`
   (persistence, consolidated from a separate `repository/` folder) as dedicated
   subsystems; `Logger.js` relocated to `shared/logger/`. Every import path across the
   entire codebase updated and re-verified — confirmed via a full syntax sweep, a live
   `CommandRegistry`/`EventRegistry` load (17 commands, 5 events), and a full `Bot.js`
   module-graph import, which transitively exercises every file in the new tree.
4. **Legacy purge** — `src/struct/`, `src/commands/`, `src/events/`, `src/models/`,
   `src/utils/{Pagination,Types,Utils}.js`, and the legacy half of `src/player/` (the
   discord-music-player-era files that shared a directory name with the new audio
   subsystem) are **deleted**, not just marked deletable. Verified safe first: every
   legacy-path reference found in the new architecture before deletion was inside a
   comment, not an import.
5. **Dependency cleanup** — `package.json` down to 9 real dependencies (from 20+), one
   dead package (`@snazzah/davey`) found during the audit that had survived the Lavalink
   pivot unnoticed, and the now-unnecessary `discord-api-types` override removed after
   confirming (not assuming) it no longer resolves any conflict. `npm audit`: **0
   vulnerabilities**, down from 18 at the start of the pivot and 6 immediately after it.

This file's original purpose — a checklist gating when legacy code could safely be deleted
— is complete. What's left (`/search` autocomplete, the dashboard channel, custom playlists,
more emoji icons) are net-new features, not migration debt.
