local TimingData = ED.class()

function TimingData:__init()
    ED.Events:Subscribe("TimingDataInterval", self, self.Interval)
end

function TimingData:Interval()
    ED.file.Write(self:GetTimingData(), ED.constants.data_timings_filename)
end

function TimingData:GetTimingData(s)
    local data_to_write = ""
    for _, pref in pairs(ED.constants.itg_timing_prefs) do
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
    return data_to_write
end

return TimingData()