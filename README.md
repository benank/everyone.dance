# everyone.dance
A synchronized near-realtime score sharing system for Stepmania. It's meant to be an easily accessible and usable platform for playing with others in Stepmania without hassle.

Please note: this is a very highly WIP system right now. It will be available in the future at [everyone.dance](https://everyone.dance/). This readme and repo will be updated as progress continues.

## Installation
Install the required node modules.
```
npm install
```

## Running

### Run Electron App

This runs the Electron app. This should be used when developing.

```
npm run start
```

### Build Electron App

This builds the Electron app into an exe file. This should be used when packaging the app for distribution.

```
npm run make
```

### Deploy Webapp

This deploys the app to a website. This is good if you want to display the spectator mode on your own domain.

```
npm run webapp
```

### Start Server

This starts the main server for game management. Players connect to this server to create and join games. 

```
npm run server
```


