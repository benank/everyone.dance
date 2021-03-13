// Server config
class Config
{
    constructor()
    {
        // Base path of host name without https
        // Default: "everyone.dance"
        this.hostname = "everyone.dance";

        this.port = 2053;
    
        // Launched server in test mode
        if (process.argv[2] == "--test")
        {
            this.port = 2083;
        }
    }

    getHost()
    {
        return "https://" + this.hostname;
    }
}

module.exports = {Config: new Config()}