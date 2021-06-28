-- Global everyone.dance table
ED = {}

-- Load helpers
ED.helpers           = LoadActor("./everyone.dance/core/helpers.lua")
ED.class             = LoadActor("./everyone.dance/core/class.lua")
ED.json              = LoadActor("./everyone.dance/core/json.lua")
ED.file              = LoadActor("./everyone.dance/core/file.lua")
ED.constants         = LoadActor("./everyone.dance/core/constants.lua")

-- Class related files
ED.Event             = LoadActor("./everyone.dance/core/event.lua")
ED.Events            = LoadActor("./everyone.dance/core/events.lua")

ED.ActiveSongData    = LoadActor("./everyone.dance/ActiveSongData.lua")
ED.GameCode          = LoadActor("./everyone.dance/GameCode.lua")
ED.GotoData          = LoadActor("./everyone.dance/GotoData.lua")
ED.TimingData        = LoadActor("./everyone.dance/TimingData.lua")


local function OnCurrentStepsChanged(s)
    ED.ActiveSongData:Refresh()
end

local function OnInit(s)

    ED.helpers.print("Init everyone.dance")

    -- Initialize all classes
    LoadActor("./everyone.dance/core/class_init.lua")
    
    -- Clear file so we don't crash
    ED.file.Write("", ED.constants.goto_filename)
    
    -- Begin timed intervals
    s:sleep(SYNC_INTERVAL / 1000):queuecommand("Update")
    s:sleep(timing_data_interval / 1000):queuecommand("Update2")

end

return Def.ActorFrame{
    Def.Actor{
        BeginCommand = function(s)
            OnInit(s)
        end,
        SyncIntervalCommand = function(s)
            ED.Events:Fire("SyncInterval", {actor = s})
            s:sleep(ED.constants.SYNC_INTERVAL / 1000):queuecommand("SyncInterval")
        end,
        TimingDataIntervalCommand = function(s)
            ED.Events:Fire("TimingDataInterval", {actor = s})
            s:sleep(ED.constants.timing_data_interval / 1000):queuecommand("TimingDataInterval")
        end,
        CurrentStepsP1ChangedMessageCommand = function(s, param) -- Called when difficulty or song changes for P1
            OnCurrentStepsChanged(s, param)
        end,
        CurrentStepsP2ChangedMessageCommand = function(s, param) -- Called when difficulty or song changes for P2
            OnCurrentStepsChanged(s, param)
        end
    }
}