package com.huuminhs.backend.controller;

import com.huuminhs.backend.dto.CreateStreamRequest;
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
    public ResponseEntity<List<StreamResponse>> getAllStreams() {
        log.info("Getting all streams");
        List<StreamResponse> streams = streamService.getAllStreams();
        return ResponseEntity.ok(streams);
    }

    @GetMapping("/mine")
    public ResponseEntity<List<StreamResponse>> getMyStreams(Authentication authentication) {
        log.info("Getting streams for user: {}", authentication.getName());
        List<StreamResponse> streams = streamService.getStreamsByUser(authentication.getName());
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
    public ResponseEntity<List<StreamResponse>> getLiveStreams() {
        log.info("Getting all live streams");
        List<StreamResponse> streams = streamService.getLiveStreams();
        return ResponseEntity.ok(streams);
    }

    @GetMapping("/ended")
    public ResponseEntity<List<StreamResponse>> getEndedStreams() {
        log.info("Getting all ended streams");
        List<StreamResponse> streams = streamService.getEndedStreams();
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
