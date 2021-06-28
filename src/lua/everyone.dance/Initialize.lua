local Initialize = ED.class()

function Initialize:__init()
    ED.Events:Subscribe("Begin", self, self.Begin)
end

function Initialize:Begin(args)
    
    ED.helpers.print("Init everyone.dance")

    -- Clear file so we don't crash
    ED.file.Write("", ED.constants.goto_filename)
    
    -- Begin timed intervals
    args.actor:sleep(ED.constants.SYNC_INTERVAL / 1000):queuecommand("SyncInterval")
    args.actor:sleep(ED.constants.timing_data_interval / 1000):queuecommand("TimingDataInterval")
    
    ED.helpers.print("everyone.dance init finished")
    
end

return Initialize()