local helpers = {}

-- counts an associative Lua table (use #table for sequential tables)
function helpers.count_table(table)
    local count = 0

    for k, v in pairs(table) do
        count = count + 1
    end

    return count
end

function helpers.insert(tbl, t)
    tbl[#tbl+1] = t
    return tbl
end

function helpers.remove(tbl, num_to_remove)
    local table_size = count_table(tbl)
    local new_tbl = {}
    for i = math.min(num_to_remove + 1, table_size), table_size do
        new_tbl[i - num_to_remove] = tbl[i]
    end
    return new_tbl
end

-- Print for debugging, only enabled if DEBUG_ON is true
function helpers.print(t)
    if not ED.DEBUG_ON then return end
    SCREENMAN:SystemMessage(tostring(t))
end

-- Returns the name of the top screen if it exists
function helpers.get_top_screen_name()
    local top_screen = SCREENMAN:GetTopScreen()
    if top_screen then
        return top_screen:GetName()
    end
    return "" -- Empty string if it doesn't exist
end

-- Originally from STARLIGHT theme
function helpers.FullComboType(pss)
	if pss:FullComboOfScore('TapNoteScore_W1') then -- MFC
		return 'TapNoteScore_W1'
	elseif pss:FullComboOfScore('TapNoteScore_W2') then -- PFC
		return 'TapNoteScore_W2'
	elseif pss:FullComboOfScore('TapNoteScore_W3') then -- GFC
		return 'TapNoteScore_W3'
	elseif pss:FullComboOfScore('TapNoteScore_W5') then -- FC
		return 'TapNoteScore_W4'
	else
		return nil
	end
end

function helpers.get_local_player_data()
    
    --[[

        song_info: { // Current song info, either in menu select or ingame
            name: "Flowers",
            artist: "HANA RAMAN",
            pack: "Assorted",
            charter: "Konami",
            difficulty: 10,
            difficulty_name: "Expert"
            steps: 567
        },
        ingame: false, // If this player is currently in the gameplay or scores screen in stepmania
        steps_info: { // All info about a player's current steps in a song
            TapNoteScore_W1: 0,
            TapNoteScore_W2: 0,
            TapNoteScore_W3: 0,
            TapNoteScore_W4: 0,
            TapNoteScore_W5: 0,
            TapNoteScore_Miss: 0,
            TapNoteScore_HitMine: 0,
            TapNoteScore_AvoidMine: 0,
            HoldNoteScore_MissedHold: 0,
            HoldNoteScore_Held: 0,
            HoldNoteScore_LetGo: 0
        },
        fc = 'TapNoteScore_W1', -- Full combo if there was one
        progress = 0.7, // Current song progress betwen 0 and 1
        score: 99.20,
    ]]
    
    local data = {}

    -- Support for 2 players!
    for _, pn in pairs(GAMESTATE:GetEnabledPlayers()) do
        
        local player_data =
        {
            song_info = {},
            ingame = false,
            steps_info = {},
            progress = 0,
            score = 0,
            failed = STATSMAN:GetCurStageStats():GetPlayerStageStats(pn):GetFailed(),
            sync_interval = SYNC_INTERVAL
        }

        local song = GAMESTATE:GetCurrentSong() -- Works for both music select and gameplay
        local step_data = GAMESTATE:GetCurrentSteps(pn)

        if not song then return end
        if not step_data then return end

        player_data.song_info = 
        {
            name = song:GetTranslitFullTitle(),
            artist = song:GetTranslitArtist(),
            pack = song:GetGroupName(),
            charter = step_data:GetAuthorCredit() or "???",
            difficulty = step_data:GetMeter(),
            difficulty_name = step_data:GetDifficulty() and step_data:GetDifficulty():gsub("Difficulty_", ""),
            steps = step_data:GetRadarValues(pn):GetValue(5),
            steps_type = step_data:GetStepsType(),
            song_dir = song:GetSongDir()
        }
        
        local time = song:MusicLengthSeconds()
        local minutes, seconds = math.floor(time / 60), math.floor(time % 60)

        -- Should return number of seconds passed in the song. Can be used to track song progress
        local song_progress = GAMESTATE:GetPlayerState(pn):GetSongPosition():GetMusicSeconds() / time

        player_data.progress = math.min(1, song_progress)

        local top_screen = SCREENMAN:GetTopScreen()
        -- Set progress to 1 after finishing
        if helpers.get_top_screen_name():find("ScreenEvaluation") then
            player_data.progress = 1
        end

        -- Potentially use this to get player profile name: PROFILEMAN:GetProfile(pn):GetDisplayName()

        local cur_stats = STATSMAN:GetCurStageStats()
        local player_stats = cur_stats:GetPlayerStageStats(pn);

        player_data.fc = FullComboType(player_stats) -- Returns nil if no FC

        
        local dance_points = player_stats:GetPercentDancePoints()
        -- player_data.score = player_stats:GetScore()
        player_data.score = tonumber(dance_points) * 100
        
        local mw = nil --Initialize the object
        local top_screen = SCREENMAN:GetTopScreen()
        if top_screen then -- Verify that the screen exists first before doing anything.
            mw = top_screen:GetChild("MusicWheel")
            
            -- DD support
            if mw == nil and top_screen:GetChild("Overlay") then
                mw = top_screen:GetChild("Overlay"):GetChild("LeaderboardMaster")
            end
        end
        player_data.ingame = mw == nil

        local failed = player_stats:GetFailed()

        -- Taken from STARLIGHT theme
        local W1 = player_stats:GetTapNoteScores("TapNoteScore_W1")
        local W2 = player_stats:GetTapNoteScores("TapNoteScore_W2")
        local W3 = player_stats:GetTapNoteScores("TapNoteScore_W3")
        local W4 = player_stats:GetTapNoteScores("TapNoteScore_W4")
        local W5 = player_stats:GetTapNoteScores("TapNoteScore_W5")
        local OK = player_stats:GetHoldNoteScores("HoldNoteScore_Held")
        local RealMiss = player_stats:GetTapNoteScores("TapNoteScore_Miss")
        local LetGo = player_stats:GetHoldNoteScores("HoldNoteScore_LetGo")
        local Miss = RealMiss + LetGo

        player_data.steps_info = 
        {
            ['W1'] = W1,
            ['W2'] = W2,
            ['W3'] = W3,
            ['W4'] = W4,
            ['W5'] = W5,
            ['Miss'] = RealMiss,
            ['OK'] = OK,
            ['NG'] = LetGo
        }
        
        data[tostring(pn)] = player_data
    end
    
    return data

end

function helpers.FindSongMatchingData(data)
    
    return SONGMAN:FindSong(data.song_dir) or SONGMAN:FindSong(data.song_name)

    -- The below solution may be more accurate, but does not work
    -- Apparently I can't loop through songs...so this will stay commented
    -- local songs = SONGMAN:GetSongsInGroup(data.group)
    -- if songs then
    --     for song in ivalues(songs) do
    --         if song:GetTranslitFullTitle() == data.name
    --         and song:GetTranslitArtist() == data.artist then
    --             return song
    --         end
    --     end
    -- end
end

return helpers