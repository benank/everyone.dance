import React, {useState, useEffect} from 'react';
import "../styles/install_view.scss"

import "../styles/navitem.scss"
import { APP_STATE } from './constants/app_state'

import back_arrow_icon from "../icons/back_arrow.svg"
import { CardIcon, ICON_TYPE } from "./CardIcon"


const LOCALSTORAGE_STEPMANIA_DIR = "stepmania_dir"

// Current Stepmania lua script version.
const SCRIPT_VERSION = "0.0.1-alpha"
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

export default class InstallMenu extends React.Component {

    constructor (props)
    {
        super(props);
        this.state = 
        {
            themes: {}, // All info about each theme
            stepmania_folder: localStorage.getItem(LOCALSTORAGE_STEPMANIA_DIR) || ""
        }

    }

    componentDidMount()
    {

    }

    selectStepmaniaFolder()
    {
        // Called when the user clicks the button to select their Stepmania folder
        const folders = electron.dialog.showOpenDialogSync({properties: ["openDirectory"]})

        // User exited the selection of the folder
        if (folders == undefined) {return;}

        const stepmania_dir = folders[0];
        
        localStorage.setItem(LOCALSTORAGE_STEPMANIA_DIR, stepmania_dir);
        this.setState({stepmania_folder: stepmania_dir});

        const is_theme_dir = (path) => 
        {
            return electron.fs.existsSync(path + "/ThemeInfo.ini");
        }

        // Now read all themes
        const themes_path = stepmania_dir + "/Themes"
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
            console.log(data);

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
            'ScreenEvaluation': ['decorations', 'common', 'overlay'],
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
                return;
            }
            
            // Add this path to the list of install paths
            theme_data.install_paths.push(path);
            console.log(`Found install path (${theme_data.install_paths.length}/${Object.keys(valid_install_paths).length}): ${path}`)
        }

        // TODO: in these checks, also check for install patterns to see if this theme is compatible

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

        // They have an old version
        if (theme_data.version != SCRIPT_VERSION && theme_data.version != '--')
        {
            theme_data.status = INSTALL_STATUS.UPDATE_READY;
        }

        return theme_data;
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
                            <div className="select-container">
                                <div className="select-title" onClick={() => this.selectStepmaniaFolder()}>
                                    <CardIcon icon_type={ICON_TYPE.OPEN_FOLDER} />
                                    Select StepMania Folder
                                </div>
                                <div className="select-output"></div>
                            </div>
                            <div className="theme-select-container">
                                <div className="select-title">
                                    <CardIcon icon_type={ICON_TYPE.THEME} />
                                    Select Theme to Use
                                </div>
                                <div className="themes-container">
                                    {Object.keys(this.state.themes).map((key) => 
                                    {
                                        const theme = this.state.themes[key];
                                        const icon_type = theme.status == INSTALL_STATUS.INSTALLED ? 
                                            ICON_TYPE.CHECK : 
                                            theme.status == INSTALL_STATUS.UPDATE_READY ? 
                                            ICON_TYPE.UPDATE_READY : 
                                            ICON_TYPE.X;

                                        return <div key={theme.name} className="theme-entry">
                                            {theme.name}
                                            {theme.status != INSTALL_STATUS.NOT_INSTALLED && <div className="theme-icon-leftalign">
                                                <CardIcon icon_type={icon_type} />
                                            </div>}
                                        </div>
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="right-container"></div>
                    </div>
                </div>
            </div>
        )
    }
}