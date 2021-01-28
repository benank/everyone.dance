const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    closeWindow() {
        ipcRenderer.send('close-window');
    }
})