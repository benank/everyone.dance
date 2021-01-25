const PORT = 2053;
const dotenv = require("dotenv")
const fs = require('fs');
dotenv.config();

class Server
{
    constructor()
    {
        console.log("Starting server...");

        const app = require('express')();
        const https = require('https');

        const secureServer = https.createServer({
            key: fs.readFileSync('./../server.key'),
            cert: fs.readFileSync('./../server.cert')
        }, app);

        this.io = require('socket.io')(secureServer, {
            cors: {
                origin: ["https://everyone.dance", "https://everyone.dance:443", "https://everyone.dance:2053"],
                methods: ["GET", "POST"]
            }
        });

        // Create listener
        this.io.on('connect', (client) => 
        {
            this.client_connected(client);
        })

        secureServer.listen(PORT, () => {
            console.log(`Started server successfully at port ${PORT}! Listening for connections now.`);
        })
    }

    client_connected(client)
    {
        console.log("Connected " + client.id);

        // Client disconnected
        client.on('disconnect', () => 
        {
            console.log("Disconnected " + client.id);
        })
    }
}

// Run the server
const server = new Server();