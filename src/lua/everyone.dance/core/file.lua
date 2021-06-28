local file = {}

local f = RageFileUtil.CreateRageFile()
function file.Read(filename)
    local contents
    if f:Open(filename, 1) then
        contents = f:Read()
        f:Close()
    end
    return contents
end

function file.Write(text, filename)
    if f:Open(filename, 2) then
        f:Write(text)
        f:Close()
    end
end

-- Destroy file handle when actor is unloaded
ED.Events:Subscribe("OffCommand", function()
    -- f:destroy()
end)

return file