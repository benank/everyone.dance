// Server config
class Config
{
    constructor()
    {
        // Base path of host name without https
        // Default: "everyone.dance"
        this.hostname = "everyone.dance";
    
        // Path from hostname to the server. Useful for multiple server instances or testing
        // Default: "/"
        this.hostpath = "/";

        // Launched server in test mode
        if (process.argv[2] == "--test")
        {
            this.hostpath += "test";
        }
    }

    getHost()
    {
        return new URL(this.hostpath, "https://" + this.hostname).href;
    }
}

module.exports = {Config: new Config()}