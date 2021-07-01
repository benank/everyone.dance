local ScreenManager = ED.class()

function ScreenManager:__init()
    self.current_screen_name = ED.helpers.get_top_screen_name()
    ED.Events:Subscribe("SyncInterval", self, self.Interval)
end

-- Check for a screen change on interval
function ScreenManager:Interval()
    local screen_name = ED.helpers.get_top_screen_name()
    if screen_name ~= self.current_screen_name then
        self.current_screen_name = screen_name
        ED.Events:Fire("ScreenChanged", {screen_name = screen_name})
    end
end

return ScreenManager()