const electron = require('electron');

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
    dialog: electron.remote.dialog,
    clipboard: electron.remote.clipboard,
    getAppDataPath()
    {
        return (electron.app || electron.remote.app).getPath('appData')
    }
})
