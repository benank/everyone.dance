const PORT = 2053;
const dotenv = require("dotenv");
const fs = require('fs');
const GameRoom = require('./GameRoom');
const Player = require("./Player");

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
        client.player = new Player(client);

        // Client disconnected
        client.on('disconnect', () => 
        {
            this.client_disconnected(client);
        })

        client.on('set name', (name) => 
        {
            name = name.trim();
            client.player.name = name;
            
            if (client.player.game)
            {
                this.io.to(client.player.game.game_code).emit("change player name", {id: client.id, name: client.player.name});
            }
        })

        client.on('create game room', (name) => 
        {
            client.player.spectate = false;
            this.client_create_game_room(client);
        })

        client.on('enter game code', (args) => 
        {
            client.player.spectate = args.spectate;
            this.client_enter_game_code(client, args.game_code);
        })
        
        client.on('leave game room', () => 
        {
            if (client.player.game)
            {
                Object.keys(client.rooms).forEach((room) => 
                {
                    if (typeof this.game_rooms[room] != 'undefined')
                    {
                        this.game_rooms[room].remove_player(client.player);
                    }
                })
            }
        })

        client.on('sync data', (data) => 
        {
            this.client_sync_data(client, data)
        })
    }

    // Called when a client syncs their data from stepmania to server
    client_sync_data(client, data)
    {
        client.player.data = data;
        
        if (client.player.game)
        {
            client.player.game.sync_player_data(client.player);
        }
    }

    client_disconnected(client)
    {
        console.log("Disconnected " + client.id);
        if (client.player && client.player.game)
        {
            client.player.game.remove_player(client.player);
        }
    }

    client_create_game_room(client)
    {
        if (client.player.game) {return;}

        const game_code = this.get_new_game_room_code();

        const game_room = new GameRoom(game_code, this)
        this.game_rooms[game_code] = game_room;

        game_room.add_player(client.player);
    }

    client_enter_game_code(client, game_code)
    {
        if (client.player.game) {return;}

        // Invalid game code
        if (typeof game_code == 'undefined') {return;}

        const game_room = this.game_rooms[game_code];

        // Game room does not exist
        if (typeof game_room == 'undefined') {return;}

        game_room.add_player(client.player);
    }

    /**
     * Removes a game room. Called when a game room becomes empty.
     * @param {*} game_room 
     */
    remove_game_room(game_room)
    {
        if (this.game_rooms[game_room.game_code])
        {
            console.log(`Removed game room ${game_room.game_code} because it was empty`);
            delete this.game_rooms[game_room.game_code];
        }
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