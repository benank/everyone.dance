# everyone.dance
A synchronized near-realtime score sharing system for Stepmania. It's meant to be an easily accessible and usable platform for playing with others in Stepmania without hassle.

Please note: this is a very highly WIP system right now. It will be available in the future at [everyone.dance](https://everyone.dance/). This readme and repo will be updated as progress continues.

## Installation
Install the required node modules.
```
npm install
```

## Running

First, get yourself a signed certificate/key and place them in the directory above this one. My setup uses Cloudflare to enable HTTPS on the server, so everything else must be HTTPS. Cloudflare's strict policy requires a signed certificate, so we have to use one here as well. A signed certificate is not required to run the Electron app in development mode.

### Start Developing

Start the development scripts with:

```
npm run dev
```

This will start a watcher service for changes in the React code and also start the Electron process. The Electron process will automatically update with any new changes you make in React.

### Build Electron App

This builds the Electron app into an exe file. This should be used when packaging the app for distribution.

```
npm run make
```

### Deploy Webapp

This deploys the app to a website. This is good if you want to display the spectator mode on your own domain. Probably won't work when developing on a local machine because it requires HTTPS and a signed certificate/key. This requirement is due to socket.io using an HTTPS connection that expects the signed certificate. The commend first bundles the React code together and then runs the web app.

```
npm run deploy
```

### Start Server

This starts the main server for game management. Players connect to this server to create and join games. This server probably won't work unless you set up a remote server and get a signed certificate. You could set this all up a bit easier if you didn't use a secure connection and just used HTTP, because you wouldn't need certificates.

```
npm run server
```


