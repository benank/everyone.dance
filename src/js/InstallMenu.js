import React, {useState, useEffect} from 'react';
import "../styles/install_view.scss"

import "../styles/navitem.scss"
import { APP_STATE } from './constants/app_state'

import back_arrow_icon from "../icons/back_arrow.svg"
import { CardIcon, ICON_TYPE } from "./CardIcon"
import { VERSION } from "./constants/version"


const LOCALSTORAGE_STEPMANIA_DIR = "stepmania_dir"

// Current Stepmania lua script version.
const SCRIPT_VERSION = VERSION
const SCRIPT_VERSION_PREFIX = "-- everyone.dance Version: "

const SCRIPT_SYNC_INTERVAL_PREFIX = "local SYNC_INTERVAL = "
const DEFAULT_SYNC_INTERVAL = 500;

// The everyone.dance.lua script is copied to Themes/Theme/BGAnimations
// and it is prepended with the script version and version prefix

// Themes to exclude from installation
const exclude_themes = 
{
    "_fallback": true,
    "_Installer": true,
    "home": true
}

const INSTALL_STATUS = 
{
    INSTALLED: 1,
    NOT_INSTALLED: 2,
    INCOMPATIBLE: 3,
    UPDATE_READY: 4
}

const install_status_strings = 
{
    [INSTALL_STATUS.INSTALLED]: "Installed",
    [INSTALL_STATUS.NOT_INSTALLED]: "Not Installed",
    [INSTALL_STATUS.INCOMPATIBLE]: "Incompatible",
    [INSTALL_STATUS.UPDATE_READY]: "Update Ready"
}

const install_icon_types = 
{
    [INSTALL_STATUS.INSTALLED]: ICON_TYPE.CHECK,
    [INSTALL_STATUS.NOT_INSTALLED]: ICON_TYPE.CHARTER,
    [INSTALL_STATUS.INCOMPATIBLE]: ICON_TYPE.X,
    [INSTALL_STATUS.UPDATE_READY]: ICON_TYPE.UPDATE_READY
}

const icon_color = 
{
    [ICON_TYPE.CHECK]: "#00BC13",
    [ICON_TYPE.UPDATE_READY]: "#EB9514",
    [ICON_TYPE.CHARTER]: "rgba(0, 0, 0, 0)",
    [ICON_TYPE.X]: "#E54C4C",
}

export default class InstallMenu extends React.Component {

    constructor (props)
    {
        super(props);
        this.state = 
        {
            themes: {}, // All info about each theme
            stepmania_folder: localStorage.getItem(LOCALSTORAGE_STEPMANIA_DIR) || "",
            selected_theme_path: "",
            sync_interval: DEFAULT_SYNC_INTERVAL
        }

    }

    componentDidMount()
    {
        this.get_themes_info();
    }

    selectStepmaniaFolder()
    {
        // Called when the user clicks the button to select their Stepmania folder
        const folders = electron.dialog.showOpenDialogSync({properties: ["openDirectory"]})

        // User exited the selection of the folder
        if (folders == undefined) {return;}

        const stepmania_dir = folders[0];
        
        localStorage.setItem(LOCALSTORAGE_STEPMANIA_DIR, stepmania_dir);
        this.setState({stepmania_folder: stepmania_dir, selected_theme_name: ""});

        setTimeout(() => {
            this.get_themes_info();
        }, 100);
    }

    get_themes_info()
    {
        this.setState({themes: {}})
        const stepmania_dir = this.state.stepmania_folder;

        const is_theme_dir = (path) => 
        {
            return electron.fs.existsSync(path + "/ThemeInfo.ini");
        }

        // Now read all themes
        const themes_path = stepmania_dir + "/Themes"
        if (!electron.fs.existsSync(themes_path)) {return;}

        const theme_folders = electron.fs.readdirSync(themes_path, { withFileTypes: true })
            .filter((dirent => !exclude_themes[dirent.name] && is_theme_dir(themes_path + "/" + dirent.name)));
        
        const getThemeNameAndVersionFromPath = (path) => 
        {
            try
            {
                const theme_info_path = path + "/ThemeInfo.ini";

                if (!electron.fs.existsSync(theme_info_path)) {return null;}

                const file = electron.fs.readFileSync(theme_info_path, 'utf8').toString();
                const name = file.split("\n").filter((line) => line.includes("DisplayName="))[0].replace("DisplayName=", "").trim();

                const version_arr = file.split("\n").filter((line) => line.includes("Version="));

                if (version_arr.length > 0)
                {
                    return {name: name, version: version_arr[0].replace("Version=", "").trim()}
                }

                return {name: name, version: "Default"}
            }
            catch (e)
            {
                console.log(e)
                return null;
            }
            
        }

        const all_theme_data = {}
        theme_folders.forEach((dirent) => {
            const theme_path = themes_path + "/" + dirent.name;

            const theme_name_version = getThemeNameAndVersionFromPath(theme_path);
            
            if (typeof theme_name_version != 'undefined')
            {
                console.log(`Getting theme data for ${theme_name_version.name}...`);

                const data = this.getThemeData(theme_path, theme_name_version);

                all_theme_data[theme_path] = data
            }

        });
        
        this.setState({themes: all_theme_data})

    }

    /**
     * Gets all info about a theme from its path, including installation status and real name.
     * @param {*} theme_path Path to the theme on disk
     * @returns {} An object containing: path, status (installed, not installed, incompatible, needs update), version
     */
    getThemeData(theme_path, theme_name_version)
    {
        const theme_data = 
        {
            path: theme_path,
            name: theme_name_version.name,
            theme_version: theme_name_version.version,
            status: INSTALL_STATUS.NOT_INSTALLED,
            version: "--",
            sync_interval: DEFAULT_SYNC_INTERVAL,
            install_paths: [] // List of valid install paths
        }
        
        // Valid install paths
        const valid_install_paths = 
        {
            'ScreenEvaluation': ['decorations', 'common', 'overlay', 'underlay'], // Currently unused because Init/Begin causes the game to hang
            'ScreenGameplay': ['overlay', 'decorations'],
            'ScreenSelectMusic': ['overlay', 'decorations'],
        }
        
        try
        {
            // Digital Dance support
            if (theme_data.name.includes('Digital Dance'))
            {
                valid_install_paths['ScreenSelectMusicDD'] = valid_install_paths['ScreenSelectMusic'];
                delete valid_install_paths['ScreenSelectMusic'];
            }

            for (const index in Object.keys(valid_install_paths))
            {
                const key = Object.keys(valid_install_paths)[index];
                const path = "";

                for (let i = 0; i < valid_install_paths[key].length; i++)
                {
                    const suffix = valid_install_paths[key][i];
                    const full_path = `${theme_path}/BGAnimations/${key} ${suffix}`;

                    if (electron.fs.existsSync(full_path))
                    {
                        path = full_path;
                        break;
                    }
                }

                // No path found - cannot install
                if (path.length == 0)
                {
                    theme_data.status = INSTALL_STATUS.INCOMPATIBLE;
                    return theme_data;
                }
                
                // Add this path to the list of install paths
                theme_data.install_paths.push(path);
                console.log(`Found install path (${theme_data.install_paths.length}/${Object.keys(valid_install_paths).length}): ${path}`)
            }

            // Didn't find all the install paths, so this theme is incompatible
            if (theme_data.install_paths.length != Object.keys(valid_install_paths).length)
            {
                console.log(`Did not find valid install paths. (${theme_data.install_paths.length}/${Object.keys(valid_install_paths).length})`);
                theme_data.status = INSTALL_STATUS.INCOMPATIBLE;
                return theme_data;
            }

            // Now check for the installed lua file
            const lua_file_path = `${theme_path}/BGAnimations/everyone.dance.lua`;
            
            if (electron.fs.existsSync(lua_file_path))
            {
                // Installed, so get version and sync interval
                theme_data.status = INSTALL_STATUS.INSTALLED;
                
                const file = electron.fs.readFileSync(lua_file_path, 'utf8').toString();
                const version_line_arr = file.split("\n").filter((line) => line.includes(SCRIPT_VERSION_PREFIX));
                
                if (version_line_arr.length == 0)
                {
                    console.warn(`Failed to read ${lua_file_path} due to invalid install!`);
                    this.props.createNotification({
                        bg_color: '#E54C4C', 
                        text_color: 'white',
                        text: `Failed to read everyone.dance file from theme: ${theme_data.name}. Please contact StepOnIt to fix this issue!`
                    })
                    theme_data.status = INSTALL_STATUS.INCOMPATIBLE;
                    return theme_data;
                }
                
                const version = version_line_arr[0].replace(SCRIPT_VERSION_PREFIX, "").trim();

                theme_data.version = version;

                // SCRIPT_SYNC_INTERVAL_PREFIX
                if (file.split("\n").filter((line) => line.includes(SCRIPT_SYNC_INTERVAL_PREFIX)).length > 0)
                {
                    const sync_interval = file.split("\n").filter((line) => line.includes(SCRIPT_SYNC_INTERVAL_PREFIX))[0].replace(SCRIPT_SYNC_INTERVAL_PREFIX, "").trim();
                    theme_data.sync_interval = sync_interval;
                }
            }   
            else
            {
                // Not installed
                theme_data.status = INSTALL_STATUS.NOT_INSTALLED;
            }

            // Now check to see if we find an acceptable pattern to insert at
            for (let i = 0; i < theme_data.install_paths.length; i++)
            {
                const path = theme_data.install_paths[i];
                const default_file = path + "/default.lua";

                console.log(`Checking if ${default_file} exists...`);

                // Could not find default.lua in the folder
                if (!electron.fs.existsSync(default_file))
                {
                    console.log(`File does not exist`)
                    theme_data.status = INSTALL_STATUS.INCOMPATIBLE;
                    return theme_data;
                }

                console.log("Exists!")

                const file = electron.fs.readFileSync(default_file, 'utf8').toString();
                const installable = file.split("\n").filter((line) => 
                    line.includes("LoadActor") || line.includes("LoadFallbackB")).length > 0

                if (!installable)
                {
                    console.log(`Unable to find entry point`)
                    theme_data.status = INSTALL_STATUS.INCOMPATIBLE;
                    return theme_data;
                }

            }

            // They have an old version
            if (theme_data.version != SCRIPT_VERSION && theme_data.version != '--')
            {
                theme_data.status = INSTALL_STATUS.UPDATE_READY;
            }

            return theme_data;
        } catch (e)
        {
            console.warn(`Error: ${e}`);
            theme_data.status = INSTALL_STATUS.INCOMPATIBLE;
            return theme_data;
        }
    }

    select_theme(theme_name)
    {
        this.setState({selected_theme_path: theme_name})
    }

    get_selected_status()
    {
        return this.state.themes[this.state.selected_theme_path].status
    }

    get_selected_icon_type()
    {
        return install_icon_types[this.get_selected_status()];
    }

    get_selected_color()
    {
        return icon_color[this.get_selected_icon_type()];
    }

    get_selected_install_string()
    {
        return install_status_strings[this.get_selected_status()];
    }

    get_selected_version()
    {
        return this.state.themes[this.state.selected_theme_path].version;
    }

    get_latest_version_string()
    {
        if (this.state.themes[this.state.selected_theme_path].version != SCRIPT_VERSION)
        {
            return `Latest: ${SCRIPT_VERSION}`
        }
        else
        {
            return "Latest"
        }
    }

    input_sync_interval_changed(event)
    {
        this.setState({
            sync_interval: Math.ceil(event.target.value / 100) * 100
        })
    }

    get_sync_interval()
    {
        if (this.state.themes[this.state.selected_theme_path].status == INSTALL_STATUS.NOT_INSTALLED)
        {
            return this.state.sync_interval;
        }
        else
        {
            return this.state.themes[this.state.selected_theme_path].sync_interval;
        }
    }

    show_selected_sync_interval()
    {
        // Show installed sync interval if exists, otherwise show input box for sync interval
        if (this.state.themes[this.state.selected_theme_path].status == INSTALL_STATUS.NOT_INSTALLED)
        {
            // Display input for sync interval
            return <input 
                type="range" 
                min="100" 
                step="100" 
                max="3000" 
                value={this.state.sync_interval}
                onChange={(event) => this.input_sync_interval_changed(event)}></input>
        }
    }

    install_to_selected_theme()
    {
        const theme = this.state.themes[this.state.selected_theme_path];

        // Install lua file to theme
        this.write_lua_file_to_path(theme.path)

        // Now edit the existing lua files to load the new file
        for (let i = 0; i < theme.install_paths.length; i++)
        {
            const default_path = theme.install_paths[i] + "/default.lua";
            console.log(`Installing to ${default_path}...`);
            const file = electron.fs.readFileSync(default_path, 'utf8').toString();
            const lines = file.split("\n");

            const new_file_contents = "";
            const inserted = false;

            for (let line_index = 0; line_index < lines.length; line_index++)
            {
                const line = lines[line_index];
                new_file_contents += line + "\n";

                if (inserted) {continue;}

                // Add support below for more themes

                // General Support
                if (line.includes("local t = Def.ActorFrame{}") 
                || line.includes("local t = Def.ActorFrame {}")
                || line.includes("local t = LoadFallbackB()"))
                {
                    new_file_contents += `t[#t+1] = LoadActor("../everyone.dance.lua")\n`;
                    inserted = true;
                }

                // General Support
                if (line.includes("local af = Def.ActorFrame{}"))
                {
                    new_file_contents += `af[#af+1] = LoadActor("../everyone.dance.lua")\n`;
                    inserted = true;
                }

                // Simply Love Support
                if (line.includes(`LoadActor("./PlayerModifiers.lua"),`))
                {
                    new_file_contents += `LoadActor("../everyone.dance.lua"),\n`;
                    inserted = true;
                }
                
                if (line.includes(`LoadActor("./MenuTimer.lua"),`))
                {
                    new_file_contents += `LoadActor("../everyone.dance.lua"),\n`;
                    inserted = true;
                }
                
                // Simply Love 5.3 Support
                if (line.includes(`af[#af+1] = LoadActor("./WhoIsCurrentlyWinning.lua")`))
                {
                    new_file_contents += `af[#af+1] = LoadActor("../everyone.dance.lua")\n`;
                    inserted = true;
                }
                
                // Simply Love 5.3 Support
                if (line.includes(`t[#t+1] = LoadActor("./Shared/TitleAndBanner.lua")`))
                {
                    new_file_contents += `t[#t+1] = LoadActor("../everyone.dance.lua")\n`;
                    inserted = true;
                }
                
                // StarLight Support
                if (line.includes(`t[#t+1] = StandardDecorationFromFile("StageDisplay","StageDisplay");`))
                {
                    new_file_contents += `t[#t+1] = LoadActor("../everyone.dance.lua")\n`;
                    inserted = true;
                }
                
                // Outfox Infinitesimal Support
                if (line.includes(`t[#t+1] = LoadActor("GroupSelect")`))
                {
                    new_file_contents += `t[#t+1] = LoadActor("../everyone.dance.lua")\n`;
                    inserted = true;
                }
                
                if (line.includes(`local t =  Def.ActorFrame {}`))
                {
                    new_file_contents += `t[#t+1] = LoadActor("../everyone.dance.lua")\n`;
                    inserted = true;
                }
                
                if (line.includes(`t[#t+1] = LoadActor(THEME:GetPathG("","ModDisplay"))`))
                {
                    new_file_contents += `t[#t+1] = LoadActor("../everyone.dance.lua")\n`;
                    inserted = true;
                }
                
                // WF Support
                if (line.includes(`LoadActor("./TitleAndBanner.lua"),`))
                {
                    new_file_contents += `LoadActor("../everyone.dance.lua"),\n`;
                    inserted = true;
                }
                
                // DD Support
                if (line.includes(`LoadActor('./OptionsMessage.lua'),`))
                {
                    new_file_contents += `LoadActor("../everyone.dance.lua"),\n`;
                    inserted = true;
                }
                
                // Pump Delta Support
                if (line.includes(`local song = GAMESTATE:GetCurrentSong();`))
                {
                    new_file_contents += `t[#t+1] = LoadActor("../everyone.dance.lua")\n`;
                    inserted = true;
                }
            }
            
            // Display error message for unsupported themes
            if (!inserted)
            {
                console.warn(`Failed to install to ${default_path}!`);
                this.uninstall_selected_theme();
                this.props.createNotification({
                    bg_color: '#E54C4C', 
                    text_color: 'white',
                    text: 'Failed to install to theme. Please contact StepOnIt to add support for this theme!'
                })
                break;
            }

            // Write new contents with the added line to the file
            electron.fs.writeFileSync(default_path, new_file_contents);
        }

        // Refresh themes info
        this.get_themes_info();
    }

    update_selected_theme()
    {
        // Get selected theme and write the lua file to the path, overwriting the old one
        const theme = this.state.themes[this.state.selected_theme_path];
        this.write_lua_file_to_path(theme.path)

        // Refresh themes info
        this.get_themes_info();
    }

    uninstall_selected_theme()
    {
        const theme = this.state.themes[this.state.selected_theme_path];

        // Remove everyone.dance.lua
        const lua_path = theme.path + "/BGAnimations/everyone.dance.lua"
        electron.fs.unlinkSync(lua_path)

        // Remove extra lines of code that load our lua file
        
        // Now edit the existing lua files to load the new file
        for (let i = 0; i < theme.install_paths.length; i++)
        {
            const default_path = theme.install_paths[i] + "/default.lua";
            const file = electron.fs.readFileSync(default_path, 'utf8').toString();
            const lines = file.split("\n");

            const new_file_contents = "";
            const inserted = false;

            for (let line_index = 0; line_index < lines.length; line_index++)
            {
                const line = lines[line_index];

                // Don't write line if it contains the load script
                if (line.includes(`LoadActor("../everyone.dance.lua")`) )
                {
                    continue;
                }

                new_file_contents += line + "\n";
            }

            // Write new contents with the added line to the file
            electron.fs.writeFileSync(default_path, new_file_contents);
        }


        // Refresh themes info
        this.get_themes_info();
    }

    // Writes the everyone.dance lua file to the given path (minus the name)
    write_lua_file_to_path(path)
    {
        const lua_file_path = electron.dirname + "/../lua/everyone.dance.lua"
        const dest_path = path + "/BGAnimations/everyone.dance.lua"

        // Copy lua file over
        electron.fs.copyFileSync(lua_file_path, dest_path);

        // Now write version to the copied lua file
        let data = electron.fs.readFileSync(dest_path, 'utf8').toString();
        data = `${SCRIPT_VERSION_PREFIX}${SCRIPT_VERSION}\n` + `${SCRIPT_SYNC_INTERVAL_PREFIX}${this.state.sync_interval}\n` + data;

        electron.fs.writeFileSync(dest_path, data);
    }

    render () {
        return (
            <div className="installview-main-container">
                <div className="content">
                    <div className="navbar">
                        <div className="navbar-left-container">
                            <img src={back_arrow_icon} className="navitem leave" onClick={() => this.props.setAppState(APP_STATE.MAIN_MENU)}></img>
                        </div>
                    </div>
                    <div className="title-container">
                        Installation
                    </div>
                    <div className="container">
                        <div className="left-container">
                            <div className="left-half-container dir" onClick={() => this.selectStepmaniaFolder()}>
                                <div className="select-title">
                                    <CardIcon icon_type={ICON_TYPE.OPEN_FOLDER} />
                                    Select StepMania Folder
                                </div>
                                <div className="select-output" key={this.state.stepmania_folder}>{this.state.stepmania_folder}</div>
                            </div>
                            <div className="left-half-container">
                                <div className="select-title">
                                    <CardIcon icon_type={ICON_TYPE.THEME} />
                                    Select Theme to Use
                                </div>
                                <div className="themes-container">
                                    {Object.keys(this.state.themes).map((key) => 
                                    {
                                        const theme = this.state.themes[key];
                                        const icon_type = install_icon_types[theme.status]

                                        return <div key={theme.path + icon_type + this.state.stepmania_folder} className={`theme-entry ${this.state.selected_theme_path == key ? 'active' : ''}`} 
                                                onClick={() => this.select_theme(key)}>
                                            {theme.name} ({theme.theme_version})
                                            {theme.status != INSTALL_STATUS.NOT_INSTALLED && <div className="theme-icon-leftalign">
                                                <CardIcon icon_type={icon_type} color={icon_color[icon_type]} />
                                            </div>}
                                        </div>
                                    })}
                                </div>
                            </div>
                        </div>
                        {this.state.selected_theme_path.length > 0 && this.state.themes[this.state.selected_theme_path] &&
                        <div className="right-container">
                            <div className="theme-title">{this.state.themes[this.state.selected_theme_path].name} ({this.state.themes[this.state.selected_theme_path].theme_version})</div>
                            <div className="theme-status">
                                Status:
                                <CardIcon key={this.get_selected_icon_type() + this.get_selected_color()}
                                    icon_type={this.get_selected_icon_type()} 
                                    color={this.get_selected_color()} />
                                ({this.get_selected_install_string()})
                            </div>
                            <div className="theme-version">
                                Version: {this.get_selected_version()} ({this.get_latest_version_string()})
                            </div>
                            <div className="theme-sync">
                                <div className='sync-text'>Sync Interval: {this.get_sync_interval()}ms </div>
                                {this.show_selected_sync_interval()}
                            </div>
                            {this.get_selected_status() == INSTALL_STATUS.UPDATE_READY && 
                                <div className="button update" onClick={() => this.update_selected_theme()}>Update</div>}
                            {this.get_selected_status() == INSTALL_STATUS.NOT_INSTALLED && 
                                <div className="button install" onClick={() => this.install_to_selected_theme()}>Install</div>}
                            {(this.get_selected_status() == INSTALL_STATUS.UPDATE_READY || this.get_selected_status() == INSTALL_STATUS.INSTALLED) &&
                                <div className="button uninstall" onClick={() => this.uninstall_selected_theme()}>Uninstall</div>}
                        </div>}
                    </div>
                </div>
            </div>
        )
    }
}