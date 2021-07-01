--
-- json.lua
--
-- Copyright (c) 2019 rxi
--
-- Permission is hereby granted, free of charge, to any person obtaining a copy of
-- this software and associated documentation files (the "Software"), to deal in
-- the Software without restriction, including without limitation the rights to
-- use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
-- of the Software, and to permit persons to whom the Software is furnished to do
-- so, subject to the following conditions:
--
-- The above copyright notice and this permission notice shall be included in all
-- copies or substantial portions of the Software.
--
-- THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
-- IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
-- FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
-- AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
-- LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
-- OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
-- SOFTWARE.
--

local json = { _version = "0.1.2" }

-------------------------------------------------------------------------------
-- Encode
-------------------------------------------------------------------------------

json.escape_char_map = {
  [ "\\" ] = "\\\\",
  [ "\"" ] = "\\\"",
  [ "\b" ] = "\\b",
  [ "\f" ] = "\\f",
  [ "\n" ] = "\\n",
  [ "\r" ] = "\\r",
  [ "\t" ] = "\\t",
}

json.escape_char_map_inv = { [ "\\/" ] = "/" }
for k, v in pairs(json.escape_char_map) do
  json.escape_char_map_inv[v] = k
end


function json.escape_char(c)
  return json.escape_char_map[c] or string.format("\\u%04x", c:byte())
end


function json.encode_nil(val)
  return "null"
end


function json.encode_table(val, stack)
  local res = {}
  stack = stack or {}

  -- Circular reference?
  if stack[val] then error("circular reference") end

  stack[val] = true

  if rawget(val, 1) ~= nil or next(val) == nil then
    -- Treat as array -- check keys are valid and it is not sparse
    local n = 0
    for k in pairs(val) do
      if type(k) ~= "number" then
        error("invalid table: mixed or invalid key types")
      end
      n = n + 1
    end
    if n ~= #val then
      error("invalid table: sparse array")
    end
    -- Encode
    for i, v in ipairs(val) do
      table.insert(res, json.encode(v, stack))
    end
    stack[val] = nil
    return "[" .. table.concat(res, ",") .. "]"

  else
    -- Treat as an object
    for k, v in pairs(val) do
      if type(k) ~= "string" then
        error("invalid table: mixed or invalid key types")
      end
      table.insert(res, json.encode(k, stack) .. ":" .. json.encode(v, stack))
    end
    stack[val] = nil
    return "{" .. table.concat(res, ",") .. "}"
  end
end


function json.encode_string(val)
  return '"' .. val:gsub('[%z\1-\31\\"]', json.escape_char) .. '"'
end


function json.encode_number(val)
  -- Check for NaN, -inf and inf
  if val ~= val or val <= -math.huge or val >= math.huge then
    error("unexpected number value '" .. tostring(val) .. "'")
  end
  return string.format("%.14g", val)
end


json.type_func_map = {
  [ "nil"     ] = json.encode_nil,
  [ "table"   ] = json.encode_table,
  [ "string"  ] = json.encode_string,
  [ "number"  ] = json.encode_number,
  [ "boolean" ] = tostring,
}


json.encode = function(val, stack)
  local t = type(val)
  local f = json.type_func_map[t]
  if f then
    return f(val, stack)
  end
  error("unexpected type '" .. t .. "'")
end

-------------------------------------------------------------------------------
-- Decode
-------------------------------------------------------------------------------

function json.create_set(...)
  local res = {}
  for i = 1, select("#", ...) do
    res[ select(i, ...) ] = true
  end
  return res
end

json.space_chars   = json.create_set(" ", "\t", "\r", "\n")
json.delim_chars   = json.create_set(" ", "\t", "\r", "\n", "]", "}", ",")
json.escape_chars  = json.create_set("\\", "/", '"', "b", "f", "n", "r", "t", "u")
json.literals      = json.create_set("true", "false", "null")

json.literal_map = {
  [ "true"  ] = true,
  [ "false" ] = false,
  [ "null"  ] = nil,
}


function json.next_char(str, idx, set, negate)
  for i = idx, #str do
    if set[str:sub(i, i)] ~= negate then
      return i
    end
  end
  return #str + 1
end


function json.decode_error(str, idx, msg)
  local line_count = 1
  local col_count = 1
  for i = 1, idx - 1 do
    col_count = col_count + 1
    if str:sub(i, i) == "\n" then
      line_count = line_count + 1
      col_count = 1
    end
  end
  error( string.format("%s at line %d col %d", msg, line_count, col_count) )
end


function json.codepoint_to_utf8(n)
  -- http://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=iws-appendixa
  local f = math.floor
  if n <= 0x7f then
    return string.char(n)
  elseif n <= 0x7ff then
    return string.char(f(n / 64) + 192, n % 64 + 128)
  elseif n <= 0xffff then
    return string.char(f(n / 4096) + 224, f(n % 4096 / 64) + 128, n % 64 + 128)
  elseif n <= 0x10ffff then
    return string.char(f(n / 262144) + 240, f(n % 262144 / 4096) + 128,
                       f(n % 4096 / 64) + 128, n % 64 + 128)
  end
  error( string.format("invalid unicode codepoint '%x'", n) )
end


function json.parse_unicode_escape(s)
  local n1 = tonumber( s:sub(3, 6),  16 )
  local n2 = tonumber( s:sub(9, 12), 16 )
  -- Surrogate pair?
  if n2 then
    return json.codepoint_to_utf8((n1 - 0xd800) * 0x400 + (n2 - 0xdc00) + 0x10000)
  else
    return json.codepoint_to_utf8(n1)
  end
end


function json.parse_string(str, i)
  local has_unicode_escape = false
  local has_surrogate_escape = false
  local has_escape = false
  local last
  for j = i + 1, #str do
    local x = str:byte(j)

    if x < 32 then
      json.decode_error(str, j, "control character in string")
    end

    if last == 92 then -- "\\" (escape char)
      if x == 117 then -- "u" (unicode escape sequence)
        local hex = str:sub(j + 1, j + 5)
        if not hex:find("%x%x%x%x") then
          json.decode_error(str, j, "invalid unicode escape in string")
        end
        if hex:find("^[dD][89aAbB]") then
          has_surrogate_escape = true
        else
          has_unicode_escape = true
        end
      else
        local c = string.char(x)
        if not json.escape_chars[c] then
          json.decode_error(str, j, "invalid escape char '" .. c .. "' in string")
        end
        has_escape = true
      end
      last = nil

    elseif x == 34 then -- '"' (end of string)
      local s = str:sub(i + 1, j - 1)
      if has_surrogate_escape then
        s = s:gsub("\\u[dD][89aAbB]..\\u....", json.parse_unicode_escape)
      end
      if has_unicode_escape then
        s = s:gsub("\\u....", json.parse_unicode_escape)
      end
      if has_escape then
        s = s:gsub("\\.", json.escape_char_map_inv)
      end
      return s, j + 1

    else
      last = x
    end
  end
  json.decode_error(str, i, "expected closing quote for string")
end


function json.parse_number(str, i)
  local x = json.next_char(str, i, json.delim_chars)
  local s = str:sub(i, x - 1)
  local n = tonumber(s)
  if not n then
    json.decode_error(str, i, "invalid number '" .. s .. "'")
  end
  return n, x
end


function json.parse_literal(str, i)
  local x = json.next_char(str, i, json.delim_chars)
  local word = str:sub(i, x - 1)
  if not json.literals[word] then
    json.decode_error(str, i, "invalid literal '" .. word .. "'")
  end
  return json.literal_map[word], x
end


function json.parse_array(str, i)
  local res = {}
  local n = 1
  i = i + 1
  while 1 do
    local x
    i = next_char(str, i, json.space_chars, true)
    -- Empty / end of array?
    if str:sub(i, i) == "]" then
      i = i + 1
      break
    end
    -- Read token
    x, i = json.parse(str, i)
    res[n] = x
    n = n + 1
    -- Next token
    i = json.next_char(str, i, json.space_chars, true)
    local chr = str:sub(i, i)
    i = i + 1
    if chr == "]" then break end
    if chr ~= "," then json.decode_error(str, i, "expected ']' or ','") end
  end
  return res, i
end


function json.parse_object(str, i)
  local res = {}
  i = i + 1
  while 1 do
    local key, val
    i = json.next_char(str, i, json.space_chars, true)
    -- Empty / end of object?
    if str:sub(i, i) == "}" then
      i = i + 1
      break
    end
    -- Read key
    if str:sub(i, i) ~= '"' then
      json.decode_error(str, i, "expected string for key")
    end
    key, i = json.parse(str, i)
    -- Read ':' delimiter
    i = json.next_char(str, i, json.space_chars, true)
    if str:sub(i, i) ~= ":" then
      json.decode_error(str, i, "expected ':' after key")
    end
    i = json.next_char(str, i + 1, json.space_chars, true)
    -- Read value
    val, i = json.parse(str, i)
    -- Set
    res[key] = val
    -- Next token
    i = json.next_char(str, i, json.space_chars, true)
    local chr = str:sub(i, i)
    i = i + 1
    if chr == "}" then break end
    if chr ~= "," then json.decode_error(str, i, "expected '}' or ','") end
  end
  return res, i
end


json.char_func_map = {
  [ '"' ] = json.parse_string,
  [ "0" ] = json.parse_number,
  [ "1" ] = json.parse_number,
  [ "2" ] = json.parse_number,
  [ "3" ] = json.parse_number,
  [ "4" ] = json.parse_number,
  [ "5" ] = json.parse_number,
  [ "6" ] = json.parse_number,
  [ "7" ] = json.parse_number,
  [ "8" ] = json.parse_number,
  [ "9" ] = json.parse_number,
  [ "-" ] = json.parse_number,
  [ "t" ] = json.parse_literal,
  [ "f" ] = json.parse_literal,
  [ "n" ] = json.parse_literal,
  [ "[" ] = json.parse_array,
  [ "{" ] = json.parse_object,
}


json.parse = function(str, idx)
  local chr = str:sub(idx, idx)
  local f = json.char_func_map[chr]
  if f then
    return f(str, idx)
  end
  json.decode_error(str, idx, "unexpected character '" .. chr .. "'")
end


function json.decode(str)
  if type(str) ~= "string" then
    error("expected argument of type string, got " .. type(str))
  end
  local res, idx = json.parse(str, json.next_char(str, 1, json.space_chars, true))
  idx = json.next_char(str, idx, json.space_chars, true)
  if idx <= #str then
    json.decode_error(str, idx, "trailing garbage")
  end
  return res
end


return json
