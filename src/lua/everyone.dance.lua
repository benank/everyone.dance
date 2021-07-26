local f = RageFileUtil.CreateRageFile()
local function ReadFile(filename)
    local contents
    if f:Open(filename, 1) then
        contents = f:Read()
        f:Close()
    end
    return contents
end

local function WriteFile(text, filename)
    if f:Open(filename, 2) then
        f:Write(text)
        f:Close()
    end
end

local DEBUG_ON = false

-- Print for debugging, only enabled if DEBUG_ON is true
local function print(t)
    if not DEBUG_ON then return end
    SCREENMAN:SystemMessage(tostring(t))
end

local data_filename = "Save/everyone.dance.txt"
local data_timings_filename = "Save/everyone.dance.timings.txt"
local data_game_code_filename = "Save/everyone.dance.gamecode.txt"
local goto_filename = "Save/everyone.dance.txt.goto"

-- Originally from STARLIGHT theme
function FullComboType(pss)
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

local function FindSongMatchingData(data)
    
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

-- Reads the goto file to see if we should "goto" a song in the music wheel
local function ReadGotoData()

    local data = ReadFile(goto_filename)

    if not data then return end

    local split = split("\n", tostring(data))

    WriteFile("", goto_filename)
    if not split[1] or not split[2] then return end

    local target_song = FindSongMatchingData({
        song_dir = split[1],
        song_name = split[2]
    })

    local top_screen = SCREENMAN:GetTopScreen()

    if target_song and top_screen then

        local mw = top_screen:GetChild("MusicWheel")

        if mw then
            mw:SelectSong(target_song)
            mw:Move(1)
            mw:Move(-1)
            mw:Move(0)
        end

    end

end

local function IsPlayerInEvalScreen()
    local top_screen = SCREENMAN:GetTopScreen()
    if top_screen and top_screen.GetName then
        local screen_name = SCREENMAN:GetTopScreen():GetName()
        return screen_name:find("ScreenEvaluation") ~= nil
    else
        return ""
    end
end

-- Returns true if the player is playing a song / in end screen, false otherwise (aka in the music wheel or otherwise)
local function IsPlayerInGameplayScreen()
    local top_screen = SCREENMAN:GetTopScreen()
    if top_screen and top_screen.GetName then
        local screen_name = SCREENMAN:GetTopScreen():GetName()
        return screen_name == "ScreenGameplay"
    else
        return ""
    end
end

-- Gets all the data of the current song/selection and outputs it to a file for everyone.dance to read
local function RefreshActiveSongData()

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

    local data = ""

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

        -- Set progress to 1 after finishing
        if IsPlayerInEvalScreen() then
            player_data.progress = 1
        end

        -- Potentially use this to get player profile name: PROFILEMAN:GetProfile(pn):GetDisplayName()

        local cur_stats = STATSMAN:GetCurStageStats()
        local player_stats = cur_stats:GetPlayerStageStats(pn);

        player_data.fc = FullComboType(player_stats); -- Returns nil if no FC

        local dance_points = player_stats:GetPercentDancePoints()
        -- player_data.score = player_stats:GetScore()
        player_data.score = tonumber(dance_points) * 100
        
        player_data.ingame = IsPlayerInGameplayScreen() or IsPlayerInEvalScreen()

        local failed = player_stats:GetFailed()

        -- Taken from STARLIGHT theme
        local W1 = player_stats:GetTapNoteScores("TapNoteScore_W1");
        local W2 = player_stats:GetTapNoteScores("TapNoteScore_W2");
        local W3 = player_stats:GetTapNoteScores("TapNoteScore_W3");
        local W4 = player_stats:GetTapNoteScores("TapNoteScore_W4");
        local W5 = player_stats:GetTapNoteScores("TapNoteScore_W5");
        local OK = player_stats:GetHoldNoteScores("HoldNoteScore_Held");
        local RealMiss = player_stats:GetTapNoteScores("TapNoteScore_Miss");
        local LetGo = player_stats:GetHoldNoteScores("HoldNoteScore_LetGo");
        local Miss = RealMiss + LetGo;

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
        
        -- Now add to string

        data = data .. tostring(pn) .. "\n"
        for key, value in pairs(player_data) do
            if type(value) == 'table' then
                for key2, value2 in pairs(value) do
                    data = data .. key .. ":" .. tostring(key2) .. ":" .. tostring(value2) .. "\n"
                end
            else
                data = data .. key .. ":" .. tostring(value) .. "\n"
            end
        end
        
    end

    WriteFile(data, data_filename)

end

local running_time = 0

local timing_data_interval = 10 * 1000

local itg_timing_prefs = 
{
    "TimingWindowAdd",
    "RegenComboAfterMiss",
    "MaxRegenComboAfterMiss",

    "TimingWindowSecondsW1",
    "TimingWindowSecondsW2",
    "TimingWindowSecondsW3",
    "TimingWindowSecondsW4",
    "TimingWindowSecondsW5",
    "TimingWindowSecondsHold",
    "TimingWindowSecondsMine",
    "TimingWindowSecondsRoll",

    "LifeDifficultyScale",
    "LifePercentChangeW1",
    "LifePercentChangeW2",
    "LifePercentChangeW3",
    "LifePercentChangeW4",
    "LifePercentChangeW5",
    "LifePercentChangeMiss",
    "LifePercentChangeLetGo",
    "LifePercentChangeHeld",
    "LifePercentChangeHitMine",
    "InitialValue",
    "HarshHotLifePenalty",
    
    "PercentScoreWeightW1",
    "PercentScoreWeightW2",
    "PercentScoreWeightW3",
    "PercentScoreWeightW4",
    "PercentScoreWeightW5",
    "PercentScoreWeightMiss",
    "PercentScoreWeightLetGo",
    "PercentScoreWeightHeld",
    "PercentScoreWeightHitMine"
}

local function WriteTimingDataToFile(s)
    local data_to_write = ""
    for _, pref in pairs(itg_timing_prefs) do
        local value = nil
        
        if PREFSMAN:PreferenceExists(pref) then
            value = PREFSMAN:GetPreference(pref)
        elseif THEME:HasMetric("LifeMeterBar", pref) then
            value = THEME:GetMetric("LifeMeterBar", pref)
        elseif THEME:HasMetric("ScoreKeeperNormal", pref) then
            value = THEME:GetMetric("ScoreKeeperNormal", pref)
        end
        
        data_to_write = data_to_write .. tostring(pref) .. ":" .. tostring(value) .. "\n"
    end
    
    WriteFile(data_to_write, data_timings_filename)
end

local function ReadGameCodeFromFile(s)
    local contents = ReadFile(data_game_code_filename)
    EVERYONE_DANCE_GAME_CODE = contents
end

-- Player is ingame and playing a song
return Def.ActorFrame{
    Def.Actor{
        OnCommand = function(s)
            print("Init everyone.dance in " .. SCREENMAN:GetTopScreen():GetName())
            
            WriteTimingDataToFile(s)
            ReadGameCodeFromFile(s)
            RefreshActiveSongData()

            if not IsPlayerInEvalScreen() then
                s:sleep(SYNC_INTERVAL / 1000):queuecommand("SyncInterval")
            end
        end,
        SyncIntervalCommand = function(s)
            if IsPlayerInGameplayScreen() then
                RefreshActiveSongData()
            else
                ReadGotoData()
            end
            
            s:sleep(SYNC_INTERVAL / 1000):queuecommand("SyncInterval")
        end,
        CurrentStepsP1ChangedMessageCommand = function(s, param) -- Called when difficulty or song changes for P1
            if not IsPlayerInGameplayScreen() then
                RefreshActiveSongData()
            end
        end,
        CurrentStepsP2ChangedMessageCommand = function(s, param) -- Called when difficulty or song changes for P2
            if not IsPlayerInGameplayScreen() then
                RefreshActiveSongData()
            end
        end
    }
}
