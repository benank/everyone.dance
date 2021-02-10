
/** 
 * Overall variant of stepmania install
 * Generally breaks down into Major.Minor version,
 * or forked variants of these for club fantastic-like installations
 */
export const SM_INSTALL_VARIANT = {
  SM_UNKNOWN: 0,
  SM_5_0: 1,
  SM_5_1: 2,
  // 5.2 was never released, no one should be running it
  SM_5_3: 3,
  SM_CLUB_FANTASTIC: 4,
};

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
    // TODO: I wanted to import process from 'electron' in this file,
    // but when I did that the app wouldn't start, error 'require is not defined'
    this.platform = electron.os.platform();

    this.install_variant = this._install_variant(stepmania_dir);
    this.variant_dir = this._locate_variant_install(stepmania_dir);
    this.is_portable = this._is_portable(this.variant_dir);
    this.score_file = this._locate_score_file(this.variant_dir);
  }

  /**
   * Determine the overall variant of stepmania
   * @param {String} stepmania_dir Path to stepmania installation
   * @returns {SM_INSTALL_VARIANT} The installation variant
   */
  _install_variant(stepmania_dir) {
    if( !stepmania_dir ) return SM_UNKNOWN;

    if( stepmania_dir.toLowerCase().includes("club") && stepmania_dir.toLowerCase().includes("fantastic") )
    {
      return SM_INSTALL_VARIANT.SM_CLUB_FANTASTIC;
    }
    else if( stepmania_dir.includes("5.0") )
    {
      return SM_INSTALL_VARIANT.SM_5_0;
    }
    else if( stepmania_dir.includes("5.1") )
    {
      return SM_INSTALL_VARIANT.SM_5_1;
    }
    else if( stepmania_dir.includes("5.3") )
    {
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
    if( this.install_variant && this.install_variant === SM_INSTALL_VARIANT.SM_5_3 ) {
      return stepmania_dir.replace("Appearance", "");
    }
    return stepmania_dir;
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
    if( this.is_portable )
    {
      return this.variant_dir + "/Save/everyone.dance.txt";
    }

    // For standard installs it's more complicated - Save folder is in user data
    // Windows: AppData/Stepmania X.Y
    if( this.platform === "win32" )
    {
      if( this.install_variant === SM_INSTALL_VARIANT.SM_5_0 ||
          this.install_variant === SM_INSTALL_VARIANT.SM_5_1 )
      {
        return electron.getAppDataPath() + "/StepMania 5/Save/everyone.dance.txt";
      }
      else if( this.install_variant === SM_INSTALL_VARIANT.SM_5_3 )
      {
        return electron.getAppDataPath() + "/StepMania 5.3/Save/everyone.dance.txt";
      }
      else if( this.install_variant === SM_INSTALL_VARIANT.SM_CLUB_FANTASTIC )
      {
        return electron.getAppDataPath() + "/Club Fantastic StepMania/Save/everyone.dance.txt";
      }
    }
    // Linux: ~/.stepmania-X.Y
    // Mac: Assumed to be same as Linux here
    else if( this.platform === "linux" || process.platform === "darwin")
    {
      if( this.install_variant === SM_INSTALL_VARIANT.SM_5_0 )
      {
        return electron.getHomePath() + "/.stepmania-5.0/Save/everyone.dance.txt";
      }
      else if( this.install_variant === SM_INSTALL_VARIANT.SM_5_1 )
      {
        return electron.getHomePath() + "/.stepmania-5.1/Save/everyone.dance.txt";
      }
      else if( this.install_variant === SM_INSTALL_VARIANT.SM_5_3 )
      {
        return electron.getHomePath() + "/.stepmania-5.3/Save/everyone.dance.txt";
      }
    }

    return null;
  }

}
