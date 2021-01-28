const { app, BrowserWindow, ipcMain, Notification } = require('electron');

const path = require('path');
const isDev = !app.isPackaged;

if (isDev) {
    require('electron-reload')(__dirname, {
        electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
    })
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1024,
        height: 720,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'src', 'js', 'preload.js'),
        },
        icon: "favicon.ico",
        frame: false
    })

    // win.removeMenu(); // Disable for now. If uncommented, removes the devtools menu.
    win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
})

ipcMain.on('close-window', (_, message) => {
    app.quit();
})