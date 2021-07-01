local API = ED.class()

function API:__init()
    -- All players data
    self.players = {}
    
    -- All options data
    self.options = {}
    
    -- Default false until the data is read.
    -- use API:GetEnabled() to check if the API is enabled at any point since it can change.
    self.enabled = false
    
    ED.Events:Subscribe("SyncInterval", self, self.Interval)
    ED.Events:Subscribe("ScreenChanged", self, self.ScreenChanged)
    
    -- Clear the API files on startup
    self:ClearFiles()
    
    -- To hook into the API from a non-ED-class based system, wait until 
    -- ED.API.ready is true, then you can use ED.API.
    self.ready = true
end

function API:ScreenChanged(args)
    -- On a screen change, clear the API files.
    -- This way, the API will never have out of date data (in case the ED client closes but SM is open).
    -- After clearing the files, it will wait for the next interval to read the data and refresh the API.
    self:ClearFiles() 
end

-- Clears all data from the files so the ED client has to write to them again.
function API:ClearFiles()
    ED.file.Write("{}", ED.constants.data_options_filename) 
    ED.file.Write("{}", ED.constants.data_players_filename) 
end

function API:GetEnabled()
    return self.enabled 
end

--[[
    Returns the number of players in the game. By default, it will include all players.
    
    filter (in table) (optional):
        count_versus_as_two (bool, default false)
            Whether or not to count versus mode (two people on one machine with one ED) as two players
        spectate (bool)
            Whether or not to include players who are spectating
        web_view (bool)
            Whether or not to include players who are spectating through the website
        ingame (bool)
            Whether or not to only include players who are ingame/not ingame. 
            Leave blank to include regardless of ingame status.
]]
function API:GetNumPlayers(filter)
     
end

--[[
    Returns a table of players in the game. By default, it will include all players.
    
    filter (in table) (optional):
        spectate (bool)
            Whether or not to include players who are spectating
        web_view (bool)
            Whether or not to include players who are spectating through the website
        ingame (bool)
            Whether or not to only include players who are ingame/not ingame. 
            Leave blank to include regardless of ingame status.

]]
function API:GetPlayers(options)
    if options == nil then
        return self.players
    else
        local filtered_players = {}
        
        for id, player_data in pairs(self.players) do
            
        end
    end
end

function API:Interval()
    self:RefreshPlayersData()
    self:RefreshOptionsData()
end

function API:RefreshPlayersData()
    
    if not self.enabled then
        self.players = {}
        return
    end
    
    local contents = ED.file.Read(ED.constants.data_players_filename)
    if not contents then return end
    
    -- No change in data
    if contents == self.old_contents then return end
    
    local json_parsed = ED.json.decode(contents)
    local old_players = self.players
    self.players = json_parsed
    self.old_contents = contents
    
    ED.Events:Fire("API/PlayersChanged", {players = self.players, old_players = old_players})
end

function API:RefreshOptionsData()
    local contents = ED.file.Read(ED.constants.data_options_filename)
    if not contents then return end
    
    -- No change in data
    if contents == self.old_options_contents then return end
    
    local json_parsed = ED.json.decode(contents)
    local old_options = self.options
    self.options = json_parsed
    self.old_options_contents = contents
    
    self.enabled = self.options.api == true
    
    -- Refresh players data if options changed
    self:RefreshPlayersData()
    
    ED.Events:Fire("API/OptionsChanged", {options = self.options, old_options = old_options})
end

return API()