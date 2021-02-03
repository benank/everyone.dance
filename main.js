const { app, BrowserWindow, ipcMain, Notification } = require('electron');

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
        icon: path.join(__dirname, 'src', 'favicon.ico'),
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

// Auto-updater
const package_config = require('./package.json');
const ghLatestRelease = require('gh-latest-release');

let update_ready = false;
let latest_release = {}

let stop_update = false;
ipcMain.on('stop update', (_, message) => {
    console.log("STOP")
    stop_update = true;
})

ipcMain.on('start update', (_, ...args) => {
    console.log("Starting update...")

    const url = latest_release.assets[0].browser_download_url;
    const { parse } = require('url')
    const https = require('follow-redirects').https
    const fs = require('fs')
    const { basename } = require('path')
    const dir = path.join(process.env.APPDATA || process.env.HOME, "everyone.dance");
    const zip_path = path.join(dir, latest_release.assets[0].name)
    const unzip_path = path.join(dir, "unzip")
    const unzipper = require("unzipper")

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

    const TIMEOUT = 10000

    const download = function (url, zip_path) {

        const file = fs.createWriteStream(zip_path)

        const options = {
            'encoding': null,
            headers: {
                'User-Agent': 'everyone.dance',
            }
        };

        return new Promise(function (resolve, reject) {
            const request = https.get(url, options).on('response', function (res) {
                const len = parseInt(res.headers['content-length'], 10)
                console.log(len)
                let downloaded = 0
                let percent = 0
                let last_percent = 0
                res
                    .on('data', function (chunk) {
                        file.write(chunk)
                        downloaded += chunk.length
                        percent = (100.0 * downloaded / len).toFixed(2)

                        if (percent - last_percent > 1) {
                            last_percent = percent;
                            win.webContents.send("update progress", percent * 0.5 / 100);
                        }

                        if (stop_update) {
                            stop_update = false;
                            console.log("Stopped download")
                            request.abort()
                            reject();
                        }

                        console.log(`Downloading ${percent}% ${downloaded} bytes\r`)
                    })
                    .on('end', function () {
                        file.end()
                        win.webContents.send("update progress", 0.5);
                        console.log(`${url} downloaded to: ${zip_path}`)
                        resolve()
                    })
                    .on('error', function (err) {
                        reject(err)
                    })
            })
            request.setTimeout(TIMEOUT, function () {
                request.abort()
                reject(new Error(`request timeout after ${TIMEOUT / 1000.0}s`))
            })
        })
    }

    download(url, zip_path).then(() => {
        console.log("Unzipping...");
        if (stop_update) {return;}
        win.webContents.send("update progress slow", {progress: 0.9, speed: 40});
        fs.createReadStream(zip_path)
        .pipe(unzipper.Extract({ path: unzip_path })).promise().then(() => 
        {
            console.log("finish unzip")
            win.webContents.send("update progress", 0.95);

            if (stop_update) {return;}

            console.log("Copying...");

            const fse = require('fs-extra');

            const srcDir = unzip_path;
            const destDir = isDev ? path.join(__dirname, "out", "everyone.dance-win32-x64") : __dirname;

            // I need to create a batch file to run separate from the electron process
            // so it can update and overwrite everything. 
            fs.writeFileSync("./update.bat", `
                timeout /t 1
                robocopy "${srcDir}" "${destDir}" /s /e
                rd /s /q "${srcDir}"
                start /d "${destDir}" everyone.dance.exe
                exit`);

            const child_process = require('child_process');
            // spawn('start cmd /c /min update.bat', [], { detached: true })
            child_process.exec('start cmd /c update.bat', {detached: true}).unref();

            app.quit();
            process.exit();
        })
    }).catch((e) => {
        // console.log("Error: " + e)
    })

})

ipcMain.on("ready", () => 
{
    CheckForNewReleases();

    setInterval(() => {
        CheckForNewReleases();
    }, 1000 * 60 * 60);
})

function CheckForNewReleases() {
    if (isDev) {return;} // Do not check for new releases on dev version

    ghLatestRelease(package_config.repository.author_reponame).then((release) => 
    {
        if (typeof release != 'undefined' && release.tag_name > package_config.version)
        {
            // New version available!
            latest_release = release;
            win.webContents.send("update ready", {current_version: package_config.version, latest_version: latest_release.tag_name});
            update_ready = true;
        }
    })

}