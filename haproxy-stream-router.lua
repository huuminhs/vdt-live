-- Lua script for intelligent MediaMTX stream routing
-- This script checks which MediaMTX server has a specific stream

local http = require("socket.http")
local json = require("json")

-- Extract stream name from request path
function get_stream_path(txn)
    local path = txn.sf:path()
    -- Extract stream name from HLS path (e.g., /stream1/index.m3u8 -> stream1)
    local stream_name = path:match("^/([^/]+)/")
    if stream_name then
        txn:set_var("req.stream_name", stream_name)
        core.log(core.info, "Extracted stream name: " .. stream_name)
    else
        core.log(core.warning, "Could not extract stream name from path: " .. path)
    end
end

-- Check if a MediaMTX server has a specific stream
function check_stream_on_server(server_host, server_port, stream_name)
    local url = "http://" .. server_host .. ":" .. server_port .. "/v3/paths/get/" .. stream_name
    local response, status = http.request(url)
    
    core.log(core.info, "Checking stream " .. stream_name .. " on " .. server_host .. ":" .. server_port .. " - Status: " .. (status or "nil"))
    
    -- Return true if stream exists (HTTP 200), false otherwise
    return status == 200
end

-- Route to the server that has the stream
function route_to_stream_server(txn)
    local stream_name = txn:get_var("req.stream_name")
    
    if not stream_name then
        core.log(core.warning, "No stream name found, using default routing")
        return
    end
    
    -- Check mediamtx1 first
    if check_stream_on_server("mediamtx1", "9997", stream_name) then
        core.log(core.info, "Stream " .. stream_name .. " found on mediamtx1")
        txn:set_var("req.target_server", "mediamtx1")
        return
    end
    
    -- Check mediamtx2
    if check_stream_on_server("mediamtx2", "9997", stream_name) then
        core.log(core.info, "Stream " .. stream_name .. " found on mediamtx2")
        txn:set_var("req.target_server", "mediamtx2")
        return
    end
    
    core.log(core.info, "Stream " .. stream_name .. " not found on any server, using round-robin")
end

-- Register Lua functions
core.register_action("get_stream_path", {"http-req"}, get_stream_path)
core.register_action("route_to_stream_server", {"http-req"}, route_to_stream_server)
