const dotenv = require("dotenv");
const fs = require('fs');
const GameRoom = require('./GameRoom');
const Player = require("./Player");
const {Config} = require("./Config");
const Log = require("./Log");
const SYNC_MODE = require("./SyncMode")

dotenv.config();

const GAME_CODE_LENGTH = 4;

class Server
{
    constructor()
    {
        Log("Starting server...");

        const app = require('express')();
        const https = require('https');

        const secureServer = https.createServer({
            key: fs.readFileSync('./../server.key'),
            cert: fs.readFileSync('./../server.cert')
        }, app);

        this.io = require('socket.io')(secureServer, {
            cors: {
                origin: [Config.getHost(), `${Config.getHost()}:443`, `${Config.getHost()}:${Config.port}`],
                methods: ["GET", "POST"]
            }
        });

        // Create listener
        this.io.on('connect', (client) => 
        {
            this.client_connected(client);
        })

        secureServer.listen(Config.port, () => {
            Log(`Started server successfully ${Config.getHost()}:${Config.port}! Listening for connections now.`);
        })

        this.game_rooms = {} // List of all active game rooms. Key is game room code
    }

    client_connected(client)
    {
        client.player = new Player(client);

        // Client disconnected
        client.on('disconnect', () => 
        {
            this.client_disconnected(client);
        })

        client.on('set name', (name) => 
        {
            name = name != null ? name.trim() : "???";
            client.player.name = name;
            
            if (client.player.game)
            {
                this.io.to(client.player.game.game_code).emit("change player name", {id: client.id, name: client.player.getName()});
            }
        })

        client.on('create game room', (name) => 
        {
            client.player.spectate = false;
            this.client_create_game_room(client);
        })

        client.on('enter game code', (args) => 
        {
            client.player.spectate = false;
            client.player.web_view = args.isWebVersion;
            this.client_enter_game_code(client, args.game_code);
        })

        client.on('update options', (options) => 
        {
            this.client_update_game_room_options(client, options)
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

    // Called when a client attempts to update options in a game room
    client_update_game_room_options(client, options)
    {
        // Only the host can update the options
        if (client.player.game && 
            client.id == client.player.game.host_id &&
            this.verify_valid_options(options))
        {
            client.player.game.update_options(options);
        }
        else
        {
            client.emit("notification", {
                bg_color: '#E54C4C', 
                text_color: 'white',
                text: 'Failed to edit game room settings: You are not the host.'
            });
        }
    }

    /**
     * Checks if game room options are valid
     * @param {*} options 
     */
    verify_valid_options(options)
    {
        if (typeof options["show_game_code"] == 'undefined' ||
            typeof options["allow_spectators"] == 'undefined' ||
            typeof options["allow_players"] == 'undefined' ||
            typeof options["player_limit"] == 'undefined' ||
            typeof options["sync_mode"] == 'undefined')
        {
            return false;   
        }

        if (options["show_game_code"] != true &&
            options["show_game_code"] != false)
        {
            return false;   
        }

        if (options["allow_spectators"] != true &&
            options["allow_spectators"] != false)
        {
            return false;   
        }

        if (options["allow_players"] != true &&
            options["allow_players"] != false)
        {
            return false;   
        }

        if (options["player_limit"] < -1 ||
            options["player_limit"] > 99)
        {
            return false;
        }

        if (options["sync_mode"] != SYNC_MODE.Realtime &&
            options["sync_mode"] != SYNC_MODE.SongTime)
        {
            return false;   
        }

        return true;
    }

    client_disconnected(client)
    {
        if (client.player && client.player.game)
        {
            client.player.game.remove_player(client.player);
        }
    }

    client_create_game_room(client)
    {
        if (client.player.game)
        {
            client.emit("notification", {
                bg_color: '#E54C4C', 
                text_color: 'white',
                text: 'Failed to create game room: You are already in a game room.'
            });
            return;
        }

        const game_code = this.get_new_game_room_code();

        const game_room = new GameRoom(game_code, this)
        this.game_rooms[game_code] = game_room;

        game_room.add_player(client.player);
    }

    client_enter_game_code(client, game_code)
    {
        if (client.player.game)
        {
            client.emit("notification", {
                bg_color: '#E54C4C', 
                text_color: 'white',
                text: 'Failed to join game room: You are already in a game.'
            });
            return;
        }

        // Invalid game code
        if (typeof game_code == 'undefined')
        {
            client.emit("notification", {
                bg_color: '#E54C4C', 
                text_color: 'white',
                text: 'Failed to join game room: Invalid game code.'
            });
        }

        const game_room = this.game_rooms[game_code];

        // Game room does not exist
        if (typeof game_room == 'undefined')
        {
            client.emit("notification", {
                bg_color: '#E54C4C', 
                text_color: 'white',
                text: 'Failed to join game room: Room does not exist.'
            });
            return;
        }

        // No players or spectators allowed in game
        if (!game_room.options.allow_players &&
            !game_room.options.allow_spectators)
        {
            client.emit("notification", {
                bg_color: '#E54C4C', 
                text_color: 'white',
                text: 'Failed to join game room: Room is closed.'
            });
            return;
        }
        else if (!game_room.options.allow_players ||
            client.player.web_view)
        {
            // Force player to spectate if players are not allowed
            // or if they are web view
            client.player.spectate = true;
        }

        if (!game_room.options.allow_spectators &&
            client.player.spectate)
        {
            client.emit("notification", {
                bg_color: '#E54C4C', 
                text_color: 'white',
                text: 'Failed to join game room: Spectators not allowed.'
            });
            return;
        }

        // Room is full (based on player limit)
        if (game_room.options.player_limit > 0 &&
            game_room.get_num_players() >= game_room.options.player_limit)
        {
            client.emit("notification", {
                bg_color: '#E54C4C', 
                text_color: 'white',
                text: 'Failed to join game room: Room is full.'
            });
            return;
        }

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
            Log(`Removed game room ${game_room.game_code} because it was empty`);
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