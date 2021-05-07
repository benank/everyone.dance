
/** 
 * Overall variant of stepmania install
 * Generally breaks down into Major.Minor version,
 * or forked variants of these for club fantastic-like installations
 */
import {isWebVersion} from "./constants/isWebVersion"

export const SM_INSTALL_VARIANT = {
    SM_UNKNOWN: 0,
    SM_5_0: 1,
    SM_5_1: 2,
    // 5.2 was never released, no one should be running it
    SM_5_3: 3,
    SM_CLUB_FANTASTIC: 4
};

const SM_DATA_NAME = "Save/everyone.dance.txt"

// All paths to SM data if not in portable mode
// Add support for more versions of SM here and in _install_variant()
const SM_DATA_PATHS = {
    // Windows: AppData/Stepmania X.Y
    ["win32"]: {
        base_dir: !isWebVersion && electron.getAppDataPath(),
        [SM_INSTALL_VARIANT.SM_5_0]: "StepMania 5",
        [SM_INSTALL_VARIANT.SM_5_1]: "StepMania 5.1",
        [SM_INSTALL_VARIANT.SM_5_3]: "StepMania 5.3",
        [SM_INSTALL_VARIANT.SM_CLUB_FANTASTIC]: "Club Fantastic StepMania"
    },
    // Linux: ~/.stepmania-X.Y
    ["linux"]: {
        base_dir: !isWebVersion && electron.getHomePath(),
        [SM_INSTALL_VARIANT.SM_5_0]: ".stepmania-5.0",
        [SM_INSTALL_VARIANT.SM_5_1]: ".stepmania-5.1",
        [SM_INSTALL_VARIANT.SM_5_3]: ".stepmania-5.3"
    },
    // Mac: ~/Library/Application Support/StepMania X.Y
    ["darwin"]: {
        base_dir: !isWebVersion && electron.getAppDataPath().replace("Application Support", "Preferences"),
        [SM_INSTALL_VARIANT.SM_5_0]: "StepMania 5",
        [SM_INSTALL_VARIANT.SM_5_1]: "StepMania 5.1",
        [SM_INSTALL_VARIANT.SM_5_3]: "StepMania 5.3"
    },

}

/**
 * Functionality for determining Stepmania installation type
 * and locating paths
 */
export default class SMInstallation {

    /**
     * Construct the class and analyse a sm installation
     * @param {String} stepmania_dir Path to stepmania installation
     * @param {String} platform Platform string from electron.process.platform
     */
    constructor(stepmania_dir, platform) {
        
        this.platform = electron.os.platform();

        this.variant_dir = this._locate_variant_install(stepmania_dir);
        this.is_portable = this._is_portable(this.variant_dir);
        this.install_variant = this._install_variant(stepmania_dir);
        this.score_file = this._locate_score_file(this.variant_dir);
    }

    /**
     * Returns the contents of log.txt in StepMania - either in StepMania/Logs/info.txt or StepMania/info.txt
     */
    _get_log_contents(stepmania_dir)
    {
        const info_file_name = "/info.txt";

        let dir = stepmania_dir;
        if (dir.includes("Appearance"))
        {
            dir = dir.replace("Appearance", "");
        }

        if (!electron.fs.existsSync(dir + "/Logs") && electron.fs.existsSync(dir + info_file_name))
        {
            // Return contents of log file
            return electron.fs.readFileSync(dir + info_file_name, 'utf8').toString();
        }
        // else if (!electron.fs.existsSync(dir + "/Logs" + info_file_name))
        // {
        //     // Try checking appdata
        //     // INACCURATE METHOD: will return first found, which may be wrong if multiple version of SM exist
        //     const keys = Object.keys(SM_DATA_PATHS[this.platform]);
        //     for (let i = 0; i < keys.length; i++)
        //     {
        //         const key = keys[i];
        //         if (key != "base_dir")
        //         {
        //             dir = SM_DATA_PATHS[this.platform]["base_dir"] + "/" + SM_DATA_PATHS[this.platform][key];
        //             if (electron.fs.existsSync(dir + "/Logs" + info_file_name))
        //             {
        //                 return electron.fs.readFileSync(dir + "/Logs" + info_file_name, 'utf8').toString();
        //             }
        //         }
        //     }
            
        //     // Logs does not always exist - sometimes it is in AppData for 5.1, so we can use another method
            
        //     return;
        // }
        else if (!electron.fs.existsSync(dir + "/Logs") && electron.fs.existsSync(dir + "/Docs/Changelog_sm5.txt"))
        {
            // Return contents of log file
            return electron.fs.readFileSync(dir + "/Docs/Changelog_sm5.txt", 'utf8').toString();
        }
        
        return electron.fs.readFileSync(dir + "/Logs" + info_file_name, 'utf8').toString();
    }

    /**
     * Determine the overall variant of stepmania
     * @param {String} stepmania_dir Path to stepmania installation
     * @returns {SM_INSTALL_VARIANT} The installation variant
     */
    _install_variant(stepmania_dir) {
        if (!stepmania_dir) return SM_INSTALL_VARIANT.SM_UNKNOWN;

        const log_contents = this._get_log_contents(stepmania_dir);
        if (typeof log_contents == 'undefined')
        {
            console.log(`Cannot get log contents`)
            return SM_INSTALL_VARIANT.SM_UNKNOWN;
        }
        
        const log_first_line = log_contents.split("\n")[0].replace(" Changelog", "");
        console.log(`StepMania Version: ${log_first_line}`);

        if (typeof log_contents != 'undefined')
        {
            // Search for version
            /*
                StepMania5.0.12
                StepMania5.1-git-7bd2118e8c
                StepMania5.3-git-7bd2118e8c
                Club Fantastic StepMania5.1-git-ff63fe792e

                ... and more?
            */

           if (log_first_line.includes("Club Fantastic StepMania5.1")) {return SM_INSTALL_VARIANT.SM_CLUB_FANTASTIC}

           if (log_first_line.includes("StepMania5.0")) {return SM_INSTALL_VARIANT.SM_5_0}
           if (log_first_line.includes("StepMania5.1")) {return SM_INSTALL_VARIANT.SM_5_1}
           if (log_first_line.includes("StepMania 5.1")) {return SM_INSTALL_VARIANT.SM_5_1}
           if (log_first_line.includes("StepMania5.3")) {return SM_INSTALL_VARIANT.SM_5_3}
        }


        // Fallback: check stepmania folder name
        if (stepmania_dir.toLowerCase().includes("club") && stepmania_dir.toLowerCase().includes("fantastic")) {
            return SM_INSTALL_VARIANT.SM_CLUB_FANTASTIC;
        }
        else if (stepmania_dir.includes("5.1")) {
            return SM_INSTALL_VARIANT.SM_5_1;
        }
        else if (stepmania_dir.includes("5.3") || stepmania_dir.toLocaleLowerCase().includes("outfox")) {
            return SM_INSTALL_VARIANT.SM_5_3;
        }
        
        return SM_INSTALL_VARIANT.SM_UNKNOWN;
    }

    /**
     * Given a base install directory, apply per-variant
     * suffixes as required
     * @param {String} stepmania_dir Path to stepmania installation
     * @returns {String} Updated directory to account for install variant
     */
    _locate_variant_install(stepmania_dir) {
        return stepmania_dir.replace("Appearance", "");
    }

    /**
     * Check if a stepmania install is in portable mode
     * Portable installs store everything next to the
     * sm executable, and don't store information in 
     * per user/appdata folders
     */
    _is_portable() {
        const portable_path = this.variant_dir + "/portable.ini";
        return electron.fs.existsSync(portable_path);
    }

    /**
     * Locate everyone.dance.txt within the sm
     * installation, or appdata directories
     * @returns {String} Path to everyone.dance.txt
     */
    _locate_score_file() {
        // Portable installs are simple - Save folder is next to executable
        if (this.is_portable) {
            return this.variant_dir + "/Save/everyone.dance.txt";
        }
        
        if (SM_DATA_PATHS[this.platform] && SM_DATA_PATHS[this.platform][this.install_variant])
        {
            const base_dir = SM_DATA_PATHS[this.platform].base_dir;
            const variant_name = SM_DATA_PATHS[this.platform][this.install_variant];
            const sm_data_name = this.platform == "darwin" ? SM_DATA_NAME.replace("Save/", "") : SM_DATA_NAME;
            return `${base_dir}/${variant_name}/${sm_data_name}`
        }

        return null;
    }

}
