-- Global everyone.dance table
ED = {}

if not ED.initialized then
    -- Load helpers
    ED.helpers           = LoadActor("./everyone.dance/core/helpers.lua")
    ED.class             = LoadActor("./everyone.dance/core/class.lua")
    ED.json              = LoadActor("./everyone.dance/core/json.lua")
    ED.constants         = LoadActor("./everyone.dance/core/constants.lua")

    -- Written to during installation
    ED.constants.SYNC_INTERVAL = SYNC_INTERVAL

    -- Class related files
    ED.Event             = LoadActor("./everyone.dance/core/event.lua")
    ED.Events            = LoadActor("./everyone.dance/core/events.lua")

    ED.file              = LoadActor("./everyone.dance/core/file.lua")

    ED.API               = LoadActor("./everyone.dance/API.lua")
    ED.ActiveSongData    = LoadActor("./everyone.dance/ActiveSongData.lua")
    ED.GameCode          = LoadActor("./everyone.dance/GameCode.lua")
    ED.GotoData          = LoadActor("./everyone.dance/GotoData.lua")
    ED.TimingData        = LoadActor("./everyone.dance/TimingData.lua")
    ED.Initialize        = LoadActor("./everyone.dance/Initialize.lua")

end

-- Initialize all classes
LoadActor("./everyone.dance/core/class_init.lua")

return Def.ActorFrame{
    Def.Actor{
        BeginCommand = function(s)
            ED.Events:Fire("Begin", {actor = s})
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
            ED.Events:Fire("CurrentStepsChanged", {actor = s, param = param})
        end,
        CurrentStepsP2ChangedMessageCommand = function(s, param) -- Called when difficulty or song changes for P2
            ED.Events:Fire("CurrentStepsChanged", {actor = s, param = param})
        end,
        OffCommand = function(s)
            ED.Events:Fire("OffCommand") 
        end
    }
}