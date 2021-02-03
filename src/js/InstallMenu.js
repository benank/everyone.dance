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
            selected_theme_name: ""
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
        
        const getThemeNameFromPath = (path) => 
        {
            try
            {
                const theme_info_path = path + "/ThemeInfo.ini";

                if (!electron.fs.existsSync(theme_info_path)) {return null;}

                const file = electron.fs.readFileSync(theme_info_path, 'utf8').toString();
                const line = file.split("\n").filter((line) => line.includes("DisplayName="))[0].replace("DisplayName=", "").trim();
                return line
            }
            catch (e)
            {
                return null;
            }
            
        }

        const all_theme_data = {}
        theme_folders.forEach((dirent) => {
            const theme_path = themes_path + "/" + dirent.name;

            const theme_name = getThemeNameFromPath(theme_path);

            console.log(`Getting theme data for ${theme_name}...`);

            const data = this.getThemeData(theme_path);
            data.name = theme_name;

            all_theme_data[data.name] = data
        });
        
        this.setState({themes: all_theme_data})

    }

    /**
     * Gets all info about a theme from its path, including installation status and real name.
     * @param {*} theme_path Path to the theme on disk
     * @returns {} An object containing: path, status (installed, not installed, incompatible, needs update), version
     */
    getThemeData(theme_path)
    {
        const theme_data = 
        {
            path: theme_path,
            status: INSTALL_STATUS.NOT_INSTALLED,
            version: "--",
            install_paths: [] // List of valid install paths
        }
        
        // Valid install paths
        const valid_install_paths = 
        {
            // 'ScreenEvaluation': ['decorations', 'common', 'overlay'], // Currently unused because Init/Begin causes the game to hang
            'ScreenGameplay': ['decorations', 'overlay'],
            'ScreenSelectMusic': ['decorations', 'overlay'],
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
            // Installed, so get version
            theme_data.status = INSTALL_STATUS.INSTALLED;
            
            const file = electron.fs.readFileSync(lua_file_path, 'utf8').toString();
            const version = file.split("\n").filter((line) => line.includes(SCRIPT_VERSION_PREFIX))[0].replace(SCRIPT_VERSION_PREFIX, "").trim();

            theme_data.version = version;
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

            const file = electron.fs.readFileSync(default_file, 'utf8').toString();
            const installable = file.split("\n").filter((line) => line.includes("LoadActor")).length > 0

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
    }

    select_theme(theme_name)
    {
        this.setState({selected_theme_name: theme_name})
    }

    get_selected_status()
    {
        return this.state.themes[this.state.selected_theme_name].status
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
        return this.state.themes[this.state.selected_theme_name].version;
    }

    get_latest_version_string()
    {
        if (this.state.themes[this.state.selected_theme_name].version != SCRIPT_VERSION)
        {
            return `Latest: ${SCRIPT_VERSION}`
        }
        else
        {
            return "Latest"
        }
    }

    install_to_selected_theme()
    {
        const theme = this.state.themes[this.state.selected_theme_name];

        // Install lua file to theme
        this.write_lua_file_to_path(theme.path)

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
                console.log(line)
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
                if (line.includes(`LoadActor("./MenuTimer.lua"),`))
                {
                    new_file_contents += `LoadActor("../everyone.dance.lua"),\n`;
                    inserted = true;
                }
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
        const theme = this.state.themes[this.state.selected_theme_name];
        this.write_lua_file_to_path(theme.path)

        // Refresh themes info
        this.get_themes_info();
    }

    uninstall_selected_theme()
    {
        const theme = this.state.themes[this.state.selected_theme_name];

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
        data = `${SCRIPT_VERSION_PREFIX}${SCRIPT_VERSION}\n` + data;

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

                                        return <div key={theme.name + icon_type + this.state.stepmania_folder} className={`theme-entry ${this.state.selected_theme_name == key ? 'active' : ''}`} 
                                                onClick={() => this.select_theme(key)}>
                                            {theme.name}
                                            {theme.status != INSTALL_STATUS.NOT_INSTALLED && <div className="theme-icon-leftalign">
                                                <CardIcon icon_type={icon_type} color={icon_color[icon_type]} />
                                            </div>}
                                        </div>
                                    })}
                                </div>
                            </div>
                        </div>
                        {this.state.selected_theme_name.length > 0 && <div className="right-container">
                            <div className="theme-title">{this.state.selected_theme_name}</div>
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