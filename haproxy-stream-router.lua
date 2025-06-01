-- Lua script for intelligent MediaMTX stream routing
-- This script checks which MediaMTX server has a specific stream

-- Global table to cache stream-to-server mappings
stream_server_cache = {}

-- Extract stream name from request path
function get_stream_path(txn)
    local path = txn.sf:path()
    -- Extract full stream path from HLS path (e.g., /stream/12/index.m3u8 -> stream/12)
    local stream_name = path:match("^/([^/]+/[^/]+)/")
    if stream_name then
        txn:set_var("req.stream_name", stream_name)
        core.log(core.info, "Extracted stream name: " .. stream_name)
        return stream_name
    else
        -- Fallback to single segment (e.g., /streamname/index.m3u8 -> streamname)
        stream_name = path:match("^/([^/]+)/")
        if stream_name then
            txn:set_var("req.stream_name", stream_name)
            core.log(core.info, "Extracted stream name (fallback): " .. stream_name)
            return stream_name
        else
            core.log(core.warning, "Could not extract stream name from path: " .. path)
            return nil
        end
    end
end

-- Check if a MediaMTX server has a specific stream using Control API
function check_stream_on_server(server_host, server_port, stream_name)
    local httpclient = core.httpclient()
    local url = "http://" .. server_host .. ":" .. server_port .. "/v3/paths/get/" .. stream_name
    
    core.log(core.info, "Checking stream " .. stream_name .. " on " .. server_host .. ":" .. server_port)
    
    local response = httpclient:get{
        url = url,
        timeout = 2000  -- 2 second timeout
    }
    
    if response and response.status == 200 then
        core.log(core.info, "Stream " .. stream_name .. " found on " .. server_host)
        return true
    else
        local status = response and response.status or "timeout"
        core.log(core.info, "Stream " .. stream_name .. " not found on " .. server_host .. " (status: " .. status .. ")")
        return false
    end
end

-- Route to the server that has the stream
function route_to_stream_server(txn)
    local stream_name = get_stream_path(txn)
    
    if not stream_name then
        core.log(core.warning, "No stream name found, using default routing")
        return
    end
    
    -- Check if we already cached this stream
    if stream_server_cache[stream_name] then
        local cached_server = stream_server_cache[stream_name]
        core.log(core.info, "Using cached server for stream " .. stream_name .. ": " .. cached_server)
        txn:set_var("req.target_server", cached_server)
        return
    end
    
    -- Check mediamtx1 first
    if check_stream_on_server("mediamtx1", "9997", stream_name) then
        core.log(core.info, "Routing stream " .. stream_name .. " to mediamtx1")
        stream_server_cache[stream_name] = "mediamtx1"
        txn:set_var("req.target_server", "mediamtx1")
        return
    end
    
    -- Check mediamtx2
    if check_stream_on_server("mediamtx2", "9997", stream_name) then
        core.log(core.info, "Routing stream " .. stream_name .. " to mediamtx2")
        stream_server_cache[stream_name] = "mediamtx2"
        txn:set_var("req.target_server", "mediamtx2")
        return
    end
    
    core.log(core.info, "Stream " .. stream_name .. " not found on any server, using round-robin")
end

-- Function to get cached server for sub-playlists and segments
function get_cached_server(txn)
    local stream_name = get_stream_path(txn)
    
    if not stream_name then
        return
    end
    
    -- Check if we have a cached server for this stream
    if stream_server_cache[stream_name] then
        local cached_server = stream_server_cache[stream_name]
        core.log(core.info, "Using cached server for stream " .. stream_name .. ": " .. cached_server)
        txn:set_var("req.target_server", cached_server)
        return
    else
        core.log(core.info, "No cached server found for stream " .. stream_name .. ", using source hash")
        -- Fallback to consistent hashing based on stream name
        local hash = 0
        for i = 1, #stream_name do
            hash = hash + string.byte(stream_name, i)
        end
        local server_choice = (hash % 2 == 0) and "mediamtx1" or "mediamtx2"
        txn:set_var("req.target_server", server_choice)
        return
    end
end

-- Register Lua functions
core.register_action("get_stream_path", {"http-req"}, get_stream_path)
core.register_action("route_to_stream_server", {"http-req"}, route_to_stream_server)
core.register_action("get_cached_server", {"http-req"}, get_cached_server)
