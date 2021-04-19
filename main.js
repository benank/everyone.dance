const { app, BrowserWindow, ipcMain } = require('electron');

const path = require('path');
const isDev = !app.isPackaged;

const DiscordRPC = require("discord-rpc");

// everyone.dance discord client ID
const clientId = '833557751849418764';

DiscordRPC.register(clientId);

const rpc = new DiscordRPC.Client({ transport: 'ipc' });
const startTimestamp = new Date();
let rpc_ready = false;

rpc.on('ready', () => {
    rpc_ready = true;
});

rpc.login({ clientId }).catch(console.error);
  
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
        title: 'everyone.dance',
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'src', 'js', 'preload.js'),
        },
        icon: path.join(__dirname, 'src', require('os').platform() == 'darwin' ? 'favicon.icns' : 'favicon.ico'),
        show: false
        // frame: false // Looks nice, but the drag css properties have issues. Might look into later
    })

    if (!isDev) {
        win.removeMenu(); // Only enable in dev mode. Otherwise, it removes the devtools menu
    }

    win.loadFile('src/index.html');

    win.on('ready-to-show', () => {
        win.show();
    })

    win.on('close', () => {
        Object.values(popout_windows).forEach((window) => {
            window.close();
        });
    })
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

const popout_data = {}
const popout_windows = {}
const window_id_to_player_id = {}

function GetWindowKey(id, p2) {
    return `${id}${p2 ? '2' : ''}`
}

ipcMain.on('popout-player', (_, args) => {

    const key = GetWindowKey(args.id, args.p2);
    // Close popout window if it is open
    if (typeof popout_windows[key] != 'undefined') {
        popout_windows[key].close();
        return;
    }

    const popout_window = new BrowserWindow({
        // parent: win,
        title: 'everyone.dance Card',
        width: 700,
        height: 300,
        title: `everyone.dance (${args.name})`,
        transparent: true,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'src', 'js', 'preload.js'),
        },
        icon: path.join(__dirname, 'src', require('os').platform() == 'darwin' ? 'favicon.icns' : 'favicon.ico'),
        frame: false,
        alwaysOnTop: true,
        show: false,
        maximizable: false,
        fullscreenable: false
    })

    popout_data[key] = args

    if (!isDev) {
        popout_window.removeMenu(); // Only enable in dev mode. Otherwise, it removes the devtools menu
    }

    popout_window.loadFile('src/index.html');

    popout_window.on('close', () => {
        delete window_id_to_player_id[popout_window.id];
        delete popout_windows[key];
    })

    popout_windows[key] = popout_window;
    window_id_to_player_id[popout_window.id] = key;
})

// Pass on data from main window to child windows
ipcMain.on('window-ready', (window_data, ...args) => {
    if (window_data.sender.id > 1) {
        const player_id = window_id_to_player_id[window_data.sender.id];
        const window = popout_windows[player_id];
        window.send('update-popout-info', popout_data[player_id]);
        window.send('game-data', latest_game_data);
        window.show();
    }
})

ipcMain.on('update-popout-size', (window_data, args) => {
    if (window_data.sender.id > 1) {
        const player_id = window_id_to_player_id[window_data.sender.id];
        const window = popout_windows[player_id];

        const current_size = window.getContentSize()

        if (Math.abs(current_size[0] - args.width) > 2 || Math.abs(current_size[1] - args.height) > 2) {
            window.setContentSize(args.width, args.height);
        }

    }
})

let latest_game_data = {};
// Pass on data from main window to child windows
ipcMain.on('game-data', (_, ...args) => {
    Object.keys(args[0]).forEach((key) => 
    {
        latest_game_data[key] = args[0][key];
    })
    
    Object.values(popout_windows).forEach((window) => {
        window.send('game-data', ...args);
    });
})

ipcMain.on('discord-data', (_, ...args) => {
    const data = args[0];
    latest_game_data.app_state = data.app_state;
    latest_game_data.game_code = data.game_room_data.game_code;
    UpdateRichPresence();
})

function UpdateRichPresence()
{
    const data = latest_game_data;
    if (typeof data == 'undefined') {return;}
    
    const details = data.app_state == 1 ? 'In Game Room' : 'In Main Menu';
    
    const activity = {
        details: details,
        startTimestamp,
        largeImageKey: 'favicon',
        instance: true,
        // The buttons show up but don't do anything when clicked...
        // If they worked, people could join with one click!
        // buttons: [
        //     {
        //         label: 'Join',
        //         url: 'https://everyone.dance'
        //     },
        //     {
        //         label: 'Spectate',
        //         url: 'https://everyone.dance'
        //     }
        // ]
    }
    
    if (data.app_state == 1 && typeof data.options != 'undefined' && typeof data.players != 'undefined')
    {
        if (data.options.show_game_code)
        {
            activity.state = `Game Code: ${data.game_code}`;
        }
        activity.largeImageText = `${Object.keys(data.players).length} Players`;
    }
    
    rpc.setActivity(activity);
}
