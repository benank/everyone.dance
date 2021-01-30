const PORT = 2053;
const dotenv = require("dotenv");
const fs = require('fs');
const GameRoom = require('./GameRoom');

dotenv.config();

const GAME_CODE_LENGTH = 4;

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

        this.game_rooms = {} // List of all active game rooms. Key is game room code
    }

    client_connected(client)
    {
        console.log("Connected " + client.id);

        // Client disconnected
        client.on('disconnect', () => 
        {
            this.client_disconnected(client);
        })
    }

    client_disconnected(client)
    {
        console.log("Disconnected " + client.id);
    }

    /**
     * Gets a new, unused game code to be used for a new game room.
     */
    get_new_game_room_code()
    {
        const GetRandomLetter = () => 
        {
            const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            return alphabet[Math.floor(Math.random() * alphabet.length)];
        }

        let retries = 0
        let game_room_code;

        do {
            game_room_code = "";
            for (let i = 0; i < GAME_CODE_LENGTH; i++)
            {
                game_room_code += GetRandomLetter();
            }
        } while (typeof this.game_rooms[game_room_code] != 'undefined' && retries < 9999);

        if (retries >= 9999)
        {
            console.error("Failed to get new room code");
        }

        return game_room_code;
    }
}

// Run the server
const server = new Server();