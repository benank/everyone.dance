const electron = require('electron');
const os = require('os');

electron.contextBridge.exposeInMainWorld('electron', {
    closeWindow() {
        electron.ipcRenderer.send('close-window');
    },
    on: (event, fn) => {
        electron.ipcRenderer.on(event, (event, ...args) => fn(...args));
    },
    send: (event, ...args) => {
        electron.ipcRenderer.send(event, ...args);
    },
    fs: electron.remote.require('fs'),
    os: os,
    dirname: __dirname,
    dialog: electron.remote.dialog,
    clipboard: electron.remote.clipboard,
    getAppDataPath()
    {
        return (electron.app || electron.remote.app).getPath('appData')
    },
    getHomePath()
    {
        return (electron.app || electron.remote.app).getPath('home')
    },
    isDev: !(electron.app || electron.remote.app).isPackaged,
    shell: electron.shell
})
