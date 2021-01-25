const PORT = 2053;

class Server
{
    constructor()
    {
        console.log("Starting server...");

        // Create socket
        this.io = require('socket.io')(PORT, {
            cors: {
                origin: ["http://localhost", "https://everyone.dance"],
                credentials: true
            },
        });

        // Create listener
        this.io.on('connect', (client) => 
        {
            this.client_connected(client);
        })

        console.log("Started server successfully! Listening for connections now.")
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