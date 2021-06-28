local GameCode = ED.class()

function GameCode:__init()
    ED.Events:Subscribe("TimingDataInterval", self, self.Interval)
end

function GameCode:Interval()
    local contents = ED.file.Read(ED.constants.data_game_code_filename)
    EVERYONE_DANCE_GAME_CODE = contents -- Kept for older compatibility
    ED.GAME_CODE = contents
end

return GameCode()