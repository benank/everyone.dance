local Event = ED.class()

local event_id = 0
function Event:__init(name, instance, callback)
    self.name = name
    self.instance = instance
    self.callback = callback
    self.id = event_id
    event_id = event_id + 1
end

function Event:Unsubscribe()
    ED.Events:Unsubscribe(self.name, self.id)
end

function Event:Fire(...)
    if self.callback then
        return self.callback(self.instance, ...)
    else
        local callback = self.instance
        return callback(...)
    end
end

return Event