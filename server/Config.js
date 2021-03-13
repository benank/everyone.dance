// Server config
class Config
{
    constructor()
    {
        // Base path of host name without https
        // Default: "everyone.dance"
        this.hostname = "everyone.dance";

        // Port that the main server runs on
        // 2053 is an example of a port that is allowed for websockets on cloudflare
        this.port = 2053;
    
        // Launched server in test mode
        if (process.argv[2] == "--test")
        {
            // Also a cloudflare websocked allowed port
            this.port = 2083;
        }
    }

    getHost()
    {
        return "https://" + this.hostname;
    }
}

module.exports = {Config: new Config()}