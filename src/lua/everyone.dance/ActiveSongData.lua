local ActiveSongData = ED.class()

-- Gets all the data of the current song/selection and outputs it to a file for everyone.dance to read
function ActiveSongData:__init()
    ED.Events:Subscribe("SyncInterval", self, self.Interval)
    ED.Events:Subscribe("CurrentStepsChanged", self, self.Refresh)
end

function ActiveSongData:Interval()
    self:Refresh()
end

function ActiveSongData:Refresh()
    -- Get player data and write json to file
    local data = ED.helpers.get_local_player_data()
    ED.file.Write(ED.json.encode(data), ED.constants.data_filename)
end

return ActiveSongData()