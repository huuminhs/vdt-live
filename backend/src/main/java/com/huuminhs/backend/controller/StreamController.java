package com.huuminhs.backend.controller;

import com.huuminhs.backend.dto.CreateStreamRequest;
import com.huuminhs.backend.dto.PaginatedResponse;
import com.huuminhs.backend.dto.StreamAccessResponse;
import com.huuminhs.backend.dto.StreamResponse;
import com.huuminhs.backend.dto.UpdateStreamRequest;
import com.huuminhs.backend.service.StreamService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/stream")
@Slf4j
public class StreamController {

    private final StreamService streamService;

    public StreamController(StreamService streamService) {
        this.streamService = streamService;
    }

    @PostMapping
    public ResponseEntity<StreamAccessResponse> createStream(
            @Valid @RequestBody CreateStreamRequest request,
            Authentication authentication) {
        log.info("Creating stream with title: {}", request.getTitle());
        StreamAccessResponse response = streamService.createStream(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<PaginatedResponse<StreamResponse>> getAllStreams(
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "10") int limit) {
        log.info("Getting all streams with cursor: {} and limit: {}", cursor, limit);
        PaginatedResponse<StreamResponse> streams = streamService.getAllStreams(cursor, limit);
        return ResponseEntity.ok(streams);
    }

    @GetMapping("/mine")
    public ResponseEntity<PaginatedResponse<StreamResponse>> getMyStreams(
            Authentication authentication,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "10") int limit) {
        log.info("Getting streams for user: {} with cursor: {} and limit: {}", authentication.getName(), cursor, limit);
        PaginatedResponse<StreamResponse> streams = streamService.getStreamsByUser(authentication.getName(), cursor, limit);
        return ResponseEntity.ok(streams);
    }

    @GetMapping("/{streamId}")
    public ResponseEntity<StreamResponse> getStreamById(@PathVariable Long streamId) {
        log.info("Getting stream with ID: {}", streamId);
        StreamResponse stream = streamService.getStreamById(streamId);
        return ResponseEntity.ok(stream);
    }

    @PutMapping("/{streamId}")
    public ResponseEntity<StreamResponse> updateStream(
            @PathVariable Long streamId,
            @Valid @RequestBody UpdateStreamRequest request,
            Authentication authentication) {
        log.info("Updating stream with ID: {}", streamId);
        StreamResponse updatedStream = streamService.updateStream(streamId, request, authentication.getName());
        return ResponseEntity.ok(updatedStream);
    }

    @DeleteMapping("/{streamId}")
    public ResponseEntity<Void> deleteStream(
            @PathVariable Long streamId,
            Authentication authentication) {
        log.info("Deleting stream with ID: {}", streamId);
        streamService.deleteStream(streamId, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/live")
    public ResponseEntity<PaginatedResponse<StreamResponse>> getLiveStreams(
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "10") int limit) {
        log.info("Getting all live streams with cursor: {} and limit: {}", cursor, limit);
        PaginatedResponse<StreamResponse> streams = streamService.getLiveStreams(cursor, limit);
        return ResponseEntity.ok(streams);
    }

    @GetMapping("/ended")
    public ResponseEntity<PaginatedResponse<StreamResponse>> getEndedStreams(
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "10") int limit) {
        log.info("Getting all ended streams with cursor: {} and limit: {}", cursor, limit);
        PaginatedResponse<StreamResponse> streams = streamService.getEndedStreams(cursor, limit);
        return ResponseEntity.ok(streams);
    }

    @PutMapping("/{streamId}/live")
    public ResponseEntity<Void> setStreamStatusToLive(@PathVariable Long streamId) {
        log.info("Setting stream {} status to LIVE", streamId);
        streamService.setStreamStatusToLive(streamId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{streamId}/ended")
    public ResponseEntity<Void> setStreamStatusToEnded(@PathVariable Long streamId) {
        log.info("Setting stream {} status to ENDED", streamId);
        streamService.setStreamStatusToEnded(streamId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{streamId}/jwt")
    public ResponseEntity<StreamAccessResponse> getStreamJwt(
            @PathVariable Long streamId,
            Authentication authentication) {
        log.info("Getting JWT for stream with ID: {}", streamId);
        StreamAccessResponse response = streamService.getStreamJwt(streamId, authentication.getName());
        return ResponseEntity.ok(response);
    }
}
