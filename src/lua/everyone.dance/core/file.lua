local file = {}

file.f = RageFileUtil.CreateRageFile()
function file.ReadFile(filename)
    local contents
    if f:Open(filename, 1) then
        contents = f:Read()
    end
    return contents
end

function file.Write(text, filename)
    if f:Open(filename, 2) then
        f:Write(text)
    end
end

return file