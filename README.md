# everyone.dance - Play StepMania together!
A realtime score sharing system for Stepmania. It's meant to be an easily accessible and usable platform for playing with others in Stepmania without hassle.

This is available at [everyone.dance](https://everyone.dance/). Please keep reading for usage instructions. You can download from that website or from the releases page here.

## How to Install / Use

### Installation
[Video tutorial here!](https://www.youtube.com/watch?v=aYH5NSDtg5M)

Head on over to [releases](https://github.com/benank/everyone.dance/releases) and download the latest zip release for your platform. Unzip that after downloading and run `everyone.dance`.

Once it opens, click Installation. This will take you to the installation screen where you can install the StepMania script for your theme. Select your StepMania directory (where the game is) and then choose the theme you want to install it to and hit Install. 

If you find that your game is stuttering or laggy after installing, hit Uninstall and try adjusting the Sync Interval. A larger number means that your scores will be synced less frequently and should result in better performance. If you have a decent computer, lower numbers are better so your scores are synced quicker.

After it's installed, you can go back and create a room. When you're in a room, you can see the synced scores and song info of everyone in it. Click your room code to copy it and give it to other people so they can join your game! You can also invite people to spectate through the web view at [everyone.dance](https://everyone.dance). They won't show up in the game and will just be a spectator.

### Game Room Settings
When in a game room, you can click the settings icon the top right corner to access the game room settings. In this menu, there are a few settings for customizing your room. Only the host of a room can change these settings. 

#### **Show Game Code**
- Toggles whether or not the game code is shown in the top center of the window.

#### **Allow Spectators**
- Toggles whether or not spectators are allowed. If disabled, spectators will not be able to join from the website and players will not be able to go into spectate mode.

#### **Allow Players**
- Toggles whether or not players are allowed. If disabled, users who join will automatically become spectators. The host can manually switch a user's mode into a player to overwrite this setting.

#### **Player Limit**
- Toggles whether or not there is a maximum player limit in the room. If enabled, the host can set the player limit between 0-99. Keep in mind that this does not restrict spectating; if the game room is full, users will join as spectators if spectators are allowed.

#### **Rank Players**
- Toggles whether or not players will be ranked according to their scores in real time. This does not change the order of players in the game room, but instead will place a number next to their name indicator their rank relative to everyone else in the game room. For example, first place will have a "1" next to their name.

#### **Version Check**
- Toggles whether or not the game room will only allow players with the latest version of everyone.dance to join. If enabled, players in the game room with outdated clients will be kicked immediately, and players with outdated clients will not be able to join.

#### **Force Ingame Layout**
- Toggles whether or not all player cards in the room will always display as if the player is ingame. This will always show their song progress and scores.

#### **Game Mode**
- Changes the game mode for the game room. When this is changed, the names of the judgements will change according to the game mode selected.
- In `ITG (Strict)` mode, it checks the player timing windows to ensure that all players are using proper ITG timing windows. See `server/ITG_Timing.js` for default timing windows. If a player's timings do not match these, they are kicked from the game room.

#### **Sync Mode**
- Sets the score sync mode in the room.
  - **Realtime** (default): player scores are synced instantly. This means that the players might be at different locations in the song if they are playing the same song, so comparing live scores may not be completely accurate until the songs are finished. This option is great for casual matches, especially if the players in the game room aren't playing the same songs.
  - **Song Time**: player scores are synced perfectly in time. However, this means that *all* players in the game room must start playing a song in order for the scores to begin displaying. This option is great for tournament settings where you want to display perfectly synced scores side-by-side in live matches for the same songs.

## Supported Themes
These themes have been tested to work with this system and the installation procedure. Any other themes may or may not work. Please feel free to create an issue for any themes that do not work and I can modify it to include them.

- XX STARLIGHT
- Simply Love
- Waterfall
- DDR Supernova 3
- Circo Cero (SM5.0)
- Lambda (SM5.1)
- Soundwaves (OutFox)
- Infinitesimal (OutFox)
- Club Fantastic
- Digital Dance
- Pump Delta

## StepMania 5.3
StepMania 5.3 (OutFox) is supported! However, when installing, please select the Appearance folder within the StepMania directory instead of the root directory.

## Club Fantastic
The Club Fantastic client is supported! However, make sure you also have the Club Fantastic theme in your themes folder. Otherwise, it will not work because you won't be able to see the Club Fantastic option in the installation menu.

## Scoring
Please note that the current implementation of this uses dance points as the percentage score on the player cards. This might change in the future or there might be an option to switch to raw score.

## Goto Button
When you're in a game room with other people, you'll see a small arrow pointing to the top right in each player card. Click that and your StepMania will automatically navigate to the song that they are currently on.

## Popout Button
When you're in a game room, you'll see a "popout" icon on the top right corner of each player card. Clicking that will pop out just that player's card so you can move it anywhere on the screen. It is always on top, so if you run StepMania in windowed mode, you can even see it when you are playing the game! This also makes it much easier to window capture in OBS - just select this specific window source. It should be titled "everyone.dance (Player Name)".

## Custom CSS Button
When you're in a game room, you'll see a button that looks like a page with the text "CSS" on it on the top right of each player card. Using this menu, you can adjust the global styling of the entire everyone.dance client, or you can adjust the specific style of that player card (using the # selector on the left). Styles are saved and persisted even when you leave the game room or close the client. Player-specific custom CSS only applies to the player if the name matches, so if the player's name changes, the CSS will no longer apply to them.

To make the most use of this, you'll have to probably go digging in the CSS or HTML code to find out what classes everything uses so you can customize it to your liking. This is a feature for advanced users and can break everything.

## New Global StepMania Variables
These variables are created by everyone.dance and are available everywhere in the StepMania Lua system:

- `EVERYONE_DANCE_GAME_CODE`: string containing the four digit game code of the room you are currently in, if any. Might return `nil` sometimes, so check if it exists before using.

## Updates
When you run everyone.dance, it will automatically check for new updates. You'll get a notification if there's a new update, and you will be able to click the "Update" button to download the latest version. After downloading, unzip and run it! You will likely have to reinstall it as well, so make sure to go to the Installation menu to do that as well.

## Developing: Installation
Install the required node modules.
```
npm install
```

## Developing: Running

First, get yourself a signed certificate/key and place them in the directory above this one. My setup uses Cloudflare to enable HTTPS on the server, so everything else must be HTTPS. Cloudflare's strict policy requires a signed certificate, so we have to use one here as well. A signed certificate is not required to run the Electron app in development mode.

### Developing: Start Developing

Start the development scripts with:

```
npm run dev
```

This will start a watcher service for changes in the React code and also start the Electron process. The Electron process will automatically update with any new changes you make in React.

### Developing: Build Electron App

This builds the Electron app into an exe file. This should be used when packaging the app for distribution.

```
npm run make
```

### Developing: Deploy Webapp

This deploys the app to a website. This is good if you want to display the spectator mode on your own domain. Probably won't work when developing on a local machine because it requires HTTPS and a signed certificate/key. This requirement is due to socket.io using an HTTPS connection that expects the signed certificate. The command first bundles the React code together and then runs the web app.

```
npm run deploy
```

### Developing: Start Server

This starts the main server for game management. Players connect to this server to create and join games. This server probably won't work unless you set up a remote server and get a signed certificate. You could set this all up a bit easier if you didn't use a secure connection and just used HTTP, because you wouldn't need certificates.

```
npm run server
```

## Contact Me!
Need help installing/using this? Want a new StepMania version/theme to be supported? Feel free to shoot me a message. Here are a few ways you can reach me:

- Discord: `StepOnIt#2565`
- [Discord Server](https://discord.gg/EA7EWCK)
- [Twitter](https://twitter.com/StepOnItDDR)
