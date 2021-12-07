<p align="center">
  <a href="https://github.com/elbkr/music-bot">
    <img src="readme/music-bot.png" alt="music-bot" />
  </a>
</p>

## Features
- Play songs from YouTube, Spotify, Apple Music and YouTube Music
- Add playlists
- Support voice and stage channels
- Allow the BOT to only play music in specific voice channels
- Allow DJ roles to manage songs
- Vote skip and force play
- Much more!

<img src="readme/splash.png" width="3000" alt="splash">

## Installation

### Requirements
- Node v16 or higher

### Getting the files
1. GitHub CLI: `gh repo clone elbkr/music-bot`
2. Download and extract the zip
3. Open with GitHub Desktop

### Creating the application
1. Create an application in [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a BOT and Copy the BOT token
4. Go to OAuth2 and copy the client ID
5. Paste the token at `TOKEN` line and the client ID  at `CLIENT_ID` line in `.env` file
6. Change `REPLACE_THIS` in the following URL with the client ID, and enter the link in your browser

`https://discord.com/api/oauth2/authorize?client_id=REPLACE_THIS&permissions=8&scope=applications.commands%20bot`

### Connecting to mongo DB
1. Login or register into [Mongo DB](https://account.mongodb.com/account/login)
2. Create a cluster and complete the configuration
3. Get the connection url by pressing on `connect < connect your application`
4. Replace the `password` with your database access password
5. Paste the URL into `.env` file  at `MONGO` line

*The URL looks like this:* `mongodb+srv://username:password@clusterName.pjxpv.mongodb.net/MyFirstDatabase?retryWrites=true&w=majority`

### Setting up emojis:
1. Download the emojis from `resource/emojis` folder
2. Add the emojis **with the same name** to a server that the BOT can access and won't leave
3. Copy the server ID
4. Paste the server ID into `.env` file at `EMOJIS_GUILD_ID` line

- You can also use your own emojis, but it could cause errors. In that case you have to add them with the same names as the ones in `resource/emojis` folder

### .ENV Output
After the configuration, the `.env` file should look like this:
```env
TOKEN=SuPerReALToken.BelIeVe_Me_itS_ReaL
MONGO=mongodb+srv://username:password@clusterName.pjxpv.mongodb.net/MyFirstDatabase?retryWrites=true&w=majority
CLIENT_ID=521311050193436682
EMOJIS_GUILD_ID=831236275162972180
```
### Running the BOT
1. Open a terminal and run `npm install` or `npm i`
2. Run `node .`

## Contributing
- Want to contribute? Feel free to make any changes you want
1. Fork or clone the repo
2. Make any changes you want (You can also see `todo` file)
3. Open a pull request explaining what changes you've made
4. I ([el bkr](https://github.com/elbkr)) will review it and accept it :D

- In case you want to contribute, and you need more emojis, you can get them from [Icons 8](https://iconos8.es/icons/color-glass)
