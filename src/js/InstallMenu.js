import React, {useState, useEffect} from 'react';
import "../styles/install_view.scss"

import "../styles/navitem.scss"
import { APP_STATE } from './constants/app_state'

import back_arrow_icon from "../icons/back_arrow.svg"

const LOCALSTORAGE_STEPMANIA_DIR = "stepmania_dir"

// Themes to exclude from installation
const exclude_themes = 
{
    "_fallback": true,
    "_Installer": true,
    "home": true
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
        console.log(electron.fs)
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
            const data = this.getThemeData(theme_path);
            data.name = theme_name;

            all_theme_data[data.name] = data
        });
        
        this.setState({themes: all_theme_data})

    }

    /**
     * Gets all info about a theme from its path, including installation status and real name.
     * @param {*} theme_path Path to the theme on disk
     * @returns {} An object containing: name, path, installed, version
     */
    getThemeData(theme_path)
    {

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
                    <div className="title-container" onClick={() => this.selectStepmaniaFolder()}>
                        Installation
                    </div>
                </div>
            </div>
        )
    }
}