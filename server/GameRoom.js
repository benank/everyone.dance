module.exports = class GameRoom
{
    constructor(game_code, io)
    {
        console.log(`Create game room ${game_code}`);
        this.io = io;
        this.game_code = game_code;
        this.players = {}
    }

    /**
     * Adds a new player to the game room
     * @param {*} player 
     */
    add_player(player)
    {
        console.log(`Add player ${player.name} to game room ${this.game_code}`);
        this.players[player.client.id] = player;
        player.client.ingame = true;
        player.client.game_code = this.game_code;
        player.client.join(this.game_code);
        io.to(this.game_code).broadcast('add player', player.getSyncData());
        player.client.emit('enter game room', this.get_all_players_sync_data(player));
    }

    /**
     * Removes a player from the game room
     * @param {*} player 
     */
    remove_player(player)
    {
        delete this.players[client.id];
        delete client.game_code;
        client.ingame = false;
        // TODO: send events
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
            if (typeof player != 'undefined' && data[key].client.id == player.client.id)
            {
                data[key].is_me = true;
            }
        })

        return data;
    }
}