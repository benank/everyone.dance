const { app, BrowserWindow, ipcMain } = require('electron');

const path = require('path');
const isDev = !app.isPackaged;

if (isDev) {
    require('electron-reload')(__dirname, {
        electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
    })
}

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 1024,
        height: 720,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'src', 'js', 'preload.js'),
        },
        icon: path.join(__dirname, 'src', require('os').platform() == 'darwin' ? 'favicon.icns' : 'favicon.ico'),
        // frame: false // Looks nice, but the drag css properties have issues. Might look into later
    })

    if (!isDev)
    {
        win.removeMenu(); // Only enable in dev mode. Otherwise, it removes the devtools menu
    }

    win.loadFile('src/index.html');
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