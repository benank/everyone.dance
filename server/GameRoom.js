module.exports = class GameRoom
{
    constructor(game_code, server)
    {
        console.log(`Create game room ${game_code}`);
        this.server = server;
        this.game_code = game_code;
        this.players = {}
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
        console.log(`Add player ${player.getName()} to game room ${this.game_code}`);
        this.players[player.client.id] = player;
        player.game = this;
        player.client.join(this.game_code);
        this.server.io.to(this.game_code).emit('add player', player.getSyncData());
        player.client.emit('enter game room', {players: this.get_all_players_sync_data(player), game_code: this.game_code});
    }

    /**
     * Removes a player from the game room
     * @param {*} player 
     */
    remove_player(player)
    {
        console.log(`Remove player ${player.getName()} from game room ${this.game_code}`);
        delete this.players[player.client.id];
        delete player.game;
        this.server.io.to(this.game_code).emit('remove player', player.client.id);
        player.client.leave(this.game_code);

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