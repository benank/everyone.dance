# everyone.dance
A synchronized near-realtime score sharing system for Stepmania. It's meant to be an easily accessible and usable platform for playing with others in Stepmania without hassle.

This is available at [everyone.dance](https://everyone.dance/). Please keep reading for usage instructions. You can download from that website or from the releases page here.

## How to Install / Use

### Installation
Head on over to [releases](https://github.com/benank/everyone.dance/releases) and download the latest zip release for your platform. Unzip that after downloading and run `everyone.dance`.

Once it opens, click Installation. This will take you to the installation screen where you can install the StepMania script for your theme. Select your StepMania directory (where the game is) and then choose the theme you want to install it to and hit Install.

After it's installed, you can go back and create a room. When you're in a room, you can see the synced scores and song info of everyone in it. Click your room code to copy it and give it to other people so they can join your game! You can also invite people to spectate through the web view at [everyone.dance](https://everyone.dance). They won't show up in the game and will just be a spectator.

## Supported Themes
These themes have been tested to work with this system and the installation procedure. Any other themes may or may not work. Please feel free to create an issue for any themes that do not work and I can modify it to include them.

- XX STARLIGHT
- Simply Love
- Waterfall
- DDR Supernova 3
- Default
- 5.3 Default
- Club Fantastic

## StepMania 5.3
StepMania 5.3 is supported! However, when installing, please select the Appearance folder within the StepMania directory instead of the root directory.

## Club Fantastic
The Club Fantastic client is supported! However, make sure you also have the Club Fantastic theme in your themes folder. Otherwise, it will not work because you won't be able to see the Club Fantastic option in the installation menu.

## Scoring
Please note that the current implementation of this uses dance points as the percentage score on the player cards. This might change in the future or there might be an option to switch to raw score.

## Goto Button
When you're in a game room with other people, you'll see a small arrow pointing to the top right in each player card. Click that and your StepMania will automatically navigate to the song that they are currently on.

## Updates
everyone.dance has automatic updates! If there's an update available, a new button will appear on the main screen called Update. Click that to automatically download and install the latest version. However, you will need to also update the StepMania script as well if it was changed, so click Installation and you'll see a new icon next to your theme. Click your theme and hit Update to install the latest script to your theme.

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

This deploys the app to a website. This is good if you want to display the spectator mode on your own domain. Probably won't work when developing on a local machine because it requires HTTPS and a signed certificate/key. This requirement is due to socket.io using an HTTPS connection that expects the signed certificate. The commend first bundles the React code together and then runs the web app.

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
