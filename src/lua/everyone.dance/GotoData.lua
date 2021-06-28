local GotoData = ED.class()

function GotoData:__init()
    ED.Events:Subscribe("SyncInterval", self, self.Interval)
end

function GotoData:Interval()
    local data = ED.file.Read(ED.constants.goto_filename)

    if not data then return end

    local split_data = split("\n", tostring(data))

    ED.file.Write("", ED.constants.goto_filename)
    if not split_data[1] or not split_data[2] then return end

    local target_song = ED.helpers.FindSongMatchingData({
        song_dir = split_data[1],
        song_name = split_data[2]
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

return GotoData()