const { openSync } = require("original-fs");
const Log = require("./Log")
const SYNC_MODE = require("./SyncMode")

module.exports = class GameRoom
{
    constructor(game_code, server)
    {
        Log(`Create game room ${game_code}`);
        this.server = server;
        this.game_code = game_code;
        this.players = {};
        this.options = {};
        this.host_id = -1;
    }

    /**
     * Returns a list of all active players in the game room.
     */
    get_num_players()
    {
        return Object.keys(this.get_players()).length;
    }

    /**
     * Returns a list of all active players in the game room.
     */
    get_players()
    {
        const keys = Object.keys(this.players).filter((key) => !this.players[key].spectate);
        const players = {};
        keys.forEach((key) => {
            players[key] = this.players[key];
        });
        return players;
    }

    /**
     * Returns a list of all spectators in the game room.
     */
    get_spectators()
    {
        const keys = Object.keys(this.players).filter((key) => this.players[key].spectate);
        const players = {};
        keys.forEach((key) => {
            players[key] = this.players[key];
        });
        return players;
    }

    get_default_options()
    {
        return {
            ["show_game_code"]: true,
            ["allow_spectators"]: true,
            ["allow_players"]: true,
            ["player_limit"]: -1,
            ["sync_mode"]: SYNC_MODE.Realtime
        }
    }

    update_options(options)
    {
        this.options = options;
        this.sync_options();
    }

    is_host(player)
    {
        return player.client.id == this.host_id;
    }

    sync_player_data(player)
    {
        if (!this.players[player.client.id]) {return;}
        this.server.io.to(this.game_code).emit('sync player data', player.getSyncData());
    }

    /**
     * Adds a new player to the game room
     * @param {*} player 
     */
    add_player(player)
    {
        Log(`Add player ${player.getName()} to game room ${this.game_code}`);

        this.players[player.client.id] = player;

        if (this.host_id == -1)
        {
            this.host_id = player.client.id;
        }

        player.game = this;
        player.client.join(this.game_code);
        this.server.io.to(this.game_code).emit('add player', player.getSyncData());
        player.client.emit('enter game room', this.get_sync_data(player));
    }

    /**
     * Removes a player from the game room
     * @param {*} player 
     */
    remove_player(player)
    {
        if (typeof player != 'undefined')
        {
            Log(`Remove player ${player.getName()} from game room ${this.game_code}`);
            delete this.players[player.client.id];

            // Host left, so reassign to random player/spectator
            if (this.host_id == player.client.id)
            {
                this.host_id = -1;

                if (Object.keys(this.players).length > 0)
                {
                    this.host_id = this.players[Object.keys(this.players)[0]];
                }
            }


            delete player.game;
            this.server.io.to(this.game_code).emit('remove player', player.client.id);
            this.sync_options();
            player.client.leave(this.game_code);
        }

        // Get all non spectating players
        if (!this.removed && Object.keys(this.players).filter((key) => !this.players[key].spectate).length == 0)
        {
            Object.keys(this.players).forEach((key) => 
            {
                this.remove_player(this.players[key]);
            })

            this.server.remove_game_room(this);
            this.removed = true;
        }
    }

    sync_options()
    {
        this.server.io.to(this.game_code).emit('update options', this.options);
    }

    get_sync_data(player)
    {
        return {
            players: this.get_all_players_sync_data(player), 
            game_code: this.game_code,
            host_id: this.host_id,
            options: this.options
        }
    }

    /**
     * Gets the sync data for all players in the game room.
     */
    get_all_players_sync_data(player)
    {
        const data = {}

        Object.keys(this.players).forEach((key) => 
        {
            data[key] = this.players[key].getSyncData();

            // If a player is specified, then check if that player matches - this will tell that player which one they are
            if (typeof player != 'undefined' && this.players[key].client.id == player.client.id)
            {
                data[key].is_me = true;
            }
        })

        return data;
    }
}