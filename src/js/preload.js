const electron = require('electron');

electron.contextBridge.exposeInMainWorld('electron', {
    closeWindow() {
        electron.ipcRenderer.send('close-window');
    },
    fs: electron.remote.require('fs'),
    dialog: electron.remote.dialog,
    clipboard: electron.remote.clipboard
})
