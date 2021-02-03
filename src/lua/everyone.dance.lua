local function ReadFile(filename)
    local f = RageFileUtil.CreateRageFile()
    local contents
    if f:Open(filename, 1) then
        contents = f:Read()
    end
    f:destroy()
    return contents
end

local function WriteFile(text, filename)
    local f = RageFileUtil.CreateRageFile()
    if f:Open(filename, 2) then
        f:Write(text)
    end
    f:destroy()
end

-- counts an associative Lua table (use #table for sequential tables)
local function count_table(table)
    local count = 0

    for k, v in pairs(table) do
        count = count + 1
    end

    return count
end

local function insert(tbl, t)
    tbl[#tbl+1] = t
    return tbl
end

local function remove(tbl, num_to_remove)
    local table_size = count_table(tbl)
    local new_tbl = {}
    for i = math.min(num_to_remove + 1, table_size), table_size do
        new_tbl[i - num_to_remove] = tbl[i]
    end
    return new_tbl
end

local DEBUG_ON = true

-- Print for debugging, only enabled if DEBUG_ON is true
local function print(t)
    if not DEBUG_ON then return end
    SCREENMAN:SystemMessage(tostring(t))
end

local data_filename = "Save/everyone.dance.txt"

-- Timer so we can perform actions on timed intervals :)
local start_time = GetTimeSinceStart()
local time = 0 -- Current time in seconds that has elapsed in this song
local last_check_time = 0

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
            score = 0
        }

        local song = GAMESTATE:GetCurrentSong() -- Works for both music select and gameplay
        local step_data = GAMESTATE:GetCurrentSteps(pn)

        player_data.song_info = 
        {
            name = song:GetTranslitFullTitle(),
            artist = song:GetTranslitArtist(),
            pack = song:GetGroupName(),
            charter = step_data:GetAuthorCredit() or "???",
            difficulty = step_data:GetMeter(),
            difficulty_name = step_data:GetDifficulty():gsub("Difficulty_", ""),
            steps = step_data:GetRadarValues(pn):GetValue(5)
        }
        
        local time = song:MusicLengthSeconds()
        local minutes, seconds = math.floor(time / 60), math.floor(time % 60)

        -- Should return number of seconds passed in the song. Can be used to track song progress
        local song_progress = GAMESTATE:GetPlayerState(pn):GetSongPosition():GetMusicSeconds() / time

        player_data.progress = math.min(1, song_progress)

        -- Potentially use this to get player profile name: PROFILEMAN:GetProfile(pn):GetDisplayName()

        local cur_stats = STATSMAN:GetCurStageStats()
        local player_stats = cur_stats:GetPlayerStageStats(pn);

        player_data.fc = FullComboType(player_stats); -- Returns nil if no FC

        
        local dance_points = player_stats:GetPercentDancePoints()
        -- player_data.score = player_stats:GetScore()
        player_data.score = tonumber(dance_points) * 100
        
        local mw = SCREENMAN:GetTopScreen():GetChild("MusicWheel")
        player_data.ingame = mw == nil

        local failed = player_stats:GetFailed()

        -- Taken from STARLIGHT theme
        local Marvelous = player_stats:GetTapNoteScores("TapNoteScore_W1");
        local Perfect = player_stats:GetTapNoteScores("TapNoteScore_W2");
        local Great = player_stats:GetTapNoteScores("TapNoteScore_W3");
        local W4 = player_stats:GetTapNoteScores("TapNoteScore_W4");
        local W5 = player_stats:GetTapNoteScores("TapNoteScore_W5");
        local Good = W4 + W5;
        local OK = player_stats:GetHoldNoteScores("HoldNoteScore_Held");
        local RealMiss = player_stats:GetTapNoteScores("TapNoteScore_Miss");
        local LetGo = player_stats:GetHoldNoteScores("HoldNoteScore_LetGo");
        local Miss = RealMiss + LetGo;

        player_data.steps_info = 
        {
            ['Marvelous'] = Marvelous,
            ['Perfect'] = Perfect,
            ['Great'] = Great,
            ['Good'] = Good,
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

local function OnSecondTick(s)
    RefreshActiveSongData()
end

-- Called every beat of the song
local function OnSongBeat(s)

    time = GetTimeSinceStart() - start_time

    if time - last_check_time >= 0.5 then
        -- One second elapsed, call the function
        OnSecondTick(s)
        last_check_time = time
    end

end

local function OnCodeMessageCommand(s)
    RefreshActiveSongData()
end

local function OnCurrentStepsChanged(s)
    RefreshActiveSongData()
end

local function OnInit(s)

    print("Init everyone.dance")

    start_time = GetTimeSinceStart()
    time = 0

end

return Def.ActorFrame{
    Def.Actor{
        InitCommand = function(s)
            OnInit(s)
        end,
        BeatCrossedMessageCommand = function(s)
            OnSongBeat(s)
        end,
        CurrentStepsP1ChangedMessageCommand = function(s, param) -- Called when difficulty or song changes for P1
            OnCurrentStepsChanged(s, param)
        end,
        CurrentStepsP2ChangedMessageCommand = function(s, param) -- Called when difficulty or song changes for P2
            OnCurrentStepsChanged(s, param)
        end
    }
}