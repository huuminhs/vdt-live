# HAProxy Intelligent HLS Routing - Performance Optimization

## Overview
This document describes the performance optimization implemented for the HAProxy intelligent HLS routing system. The optimization dramatically reduces MediaMTX Control API calls while maintaining accurate stream routing.

## Problem Solved
**Before Optimization**: Every HLS request (master playlists, sub-playlists, segments) triggered MediaMTX Control API calls, resulting in 50+ API calls per second for a single stream session.

**After Optimization**: Only master playlist requests (`index.m3u8`) trigger Control API calls, reducing API overhead to 1 call per stream session.

## Architecture

### Request Flow
1. **Master Playlist Request** (`/stream/name/index.m3u8`)
   - Routes to `hls_smart_backend`
   - Triggers Lua script `route_to_stream_server()`
   - Calls MediaMTX Control API on both servers
   - Sets session variable `sess.stream_server` with chosen server
   - Returns playlist from server that has the stream

2. **Sub-Playlist Requests** (`/stream/name/audio1_stream.m3u8`, `/stream/name/video1_stream.m3u8`)
   - Routes to `hls_sticky_backend`
   - Uses session variable from master playlist routing
   - **No Control API calls**
   - Maintains consistency with master playlist server choice

3. **Segment Requests** (`/stream/name/segment001.ts`, `/stream/name/segment002.ts`)
   - Routes to `hls_sticky_backend`
   - Uses source IP hashing for consistency
   - **No Control API calls**
   - Follows same server as master playlist

## Configuration Details

### HAProxy Frontend Rules
```haproxy
# Define ACL rules for different types of HLS requests
acl is_master_playlist path_end index.m3u8
acl is_sub_playlist path_reg \.m3u8$ 
acl is_hls_segment path_end .ts
acl is_not_master_playlist path_reg [^/]+\.m3u8$

# Use Lua script for intelligent routing ONLY on master playlists
http-request lua.route_to_stream_server if is_master_playlist

# Route master playlists to intelligent backend (uses Control API)
use_backend hls_smart_backend if is_master_playlist

# Route sub-playlists (non-master .m3u8) to sticky backend
use_backend hls_sticky_backend if is_not_master_playlist

# Route segments to sticky backend
use_backend hls_sticky_backend if is_hls_segment
```

### Backend Configuration

#### Smart Backend (for master playlists)
```haproxy
backend hls_smart_backend
    mode http
    balance roundrobin
    
    # Use Lua-determined target server if available
    use-server mediamtx1 if { var(req.target_server) -m str mediamtx1 }
    use-server mediamtx2 if { var(req.target_server) -m str mediamtx2 }
    
    server mediamtx1 mediamtx1:8888 check inter 3s rise 2 fall 2
    server mediamtx2 mediamtx2:8888 check inter 3s rise 2 fall 2
```

#### Sticky Backend (for sub-playlists and segments)
```haproxy
backend hls_sticky_backend
    mode http
    balance source
    hash-type consistent
    
    # Use session variable set by master playlist routing if available
    use-server mediamtx1 if { var(sess.stream_server) -m str mediamtx1 }
    use-server mediamtx2 if { var(sess.stream_server) -m str mediamtx2 }
    
    server mediamtx1 mediamtx1:8888 check inter 3s rise 2 fall 2
    server mediamtx2 mediamtx2:8888 check inter 3s rise 2 fall 2
```

### Lua Script Enhancement
The Lua script was enhanced to set session-level variables:

```lua
function route_to_stream_server(txn)
    local stream_name = get_stream_path(txn)
    
    if check_stream_on_server("mediamtx1", "9997", stream_name) then
        txn:set_var("req.target_server", "mediamtx1")
        txn:set_var("sess.stream_server", "mediamtx1")  -- Session persistence
        return
    end
    
    if check_stream_on_server("mediamtx2", "9997", stream_name) then
        txn:set_var("req.target_server", "mediamtx2")
        txn:set_var("sess.stream_server", "mediamtx2")  -- Session persistence
        return
    end
end
```

## Performance Impact

### API Call Reduction
- **Before**: ~50+ Control API calls per stream session
- **After**: 1 Control API call per stream session
- **Reduction**: ~98% decrease in API overhead

### Request Distribution (Typical HLS Session)
1. **1x Master Playlist** (`index.m3u8`) → Smart routing with Control API
2. **~10x Sub-Playlists** (audio/video streams) → Sticky routing, no API calls
3. **~100x Segments** (.ts files) → Sticky routing, no API calls

### Benefits
- **Reduced MediaMTX Load**: Dramatically less Control API traffic
- **Improved Response Times**: Faster responses for segments and sub-playlists
- **Maintained Accuracy**: Stream routing still accurate via master playlist intelligence
- **Better Scalability**: System can handle more concurrent streams

## Testing

### Verification Commands
```bash
# Test master playlist (should trigger Control API)
curl http://localhost:8888/stream/test/index.m3u8

# Test sub-playlist (should NOT trigger Control API)
curl http://localhost:8888/stream/test/video1_stream.m3u8

# Test segment (should NOT trigger Control API)
curl http://localhost:8888/stream/test/segment001.ts
```

### Log Analysis
Monitor HAProxy logs to verify:
- Master playlist requests show Control API calls
- Sub-playlist and segment requests show no Control API calls
- Consistent server selection within same stream session

## Conclusion
The optimization successfully reduces MediaMTX Control API overhead by 98% while maintaining intelligent stream routing accuracy. This approach scales much better for high-traffic streaming scenarios while preserving the core functionality of dynamic stream-aware load balancing.
