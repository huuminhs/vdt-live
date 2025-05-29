package com.huuminhs.backend.service;

import com.huuminhs.backend.dto.CreateStreamRequest;
import com.huuminhs.backend.dto.PaginatedResponse;
import com.huuminhs.backend.dto.StreamAccessResponse;
import com.huuminhs.backend.dto.StreamResponse;
import com.huuminhs.backend.dto.UpdateStreamRequest;
import com.huuminhs.backend.exception.StreamAccessDeniedException;
import com.huuminhs.backend.exception.StreamNotFoundException;
import com.huuminhs.backend.model.Stream;
import com.huuminhs.backend.model.StreamStatus;
import com.huuminhs.backend.model.User;
import com.huuminhs.backend.repository.StreamRepository;
import com.huuminhs.backend.repository.UserRepository;
import com.huuminhs.backend.security.JwtTokenProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class StreamService {

    private final StreamRepository streamRepository;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${stream.url.base:rtmp://localhost/stream/}")
    private String streamUrlBase;

    public StreamService(StreamRepository streamRepository, UserRepository userRepository, JwtTokenProvider jwtTokenProvider) {
        this.streamRepository = streamRepository;
        this.userRepository = userRepository;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    public StreamAccessResponse createStream(CreateStreamRequest request, String username) {
        log.info("Creating stream with title: {}", request.getTitle());

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        Stream stream = new Stream();
        stream.setTitle(request.getTitle());
        stream.setDescription(request.getDescription());
        stream.setCreatedAt(LocalDateTime.now());
        stream.setStatus(StreamStatus.CREATED);
        stream.setUser(user);

        Stream savedStream = streamRepository.save(stream);

        // Generate MediaMTX JWT token for this stream
        String mediamtxJwt = jwtTokenProvider.generateMediaMtxToken(savedStream.getId().intValue());
        String streamUrl = streamUrlBase;

        log.info("Stream created with ID: {}", savedStream.getId());

        return new StreamAccessResponse(
                savedStream.getId(),
                streamUrl,
                mediamtxJwt
        );
    }

    public PaginatedResponse<StreamResponse> getAllStreams(Long cursor, int limit) {
        log.info("Getting all streams with cursor: {} and limit: {}", cursor, limit);
        Pageable pageable = PageRequest.of(0, limit + 1); // Request one more item to determine if there are more items
        List<Stream> streams;

        if (cursor == null) {
            streams = streamRepository.findAllFirstPage(pageable);
        } else {
            streams = streamRepository.findAllWithCursor(cursor, pageable);
        }

        return createPaginatedResponse(streams, limit);
    }

    public PaginatedResponse<StreamResponse> getStreamsByUser(String username, Long cursor, int limit) {
        log.info("Getting streams for user: {} with cursor: {} and limit: {}", username, cursor, limit);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        Pageable pageable = PageRequest.of(0, limit + 1); // Request one more item to determine if there are more items
        List<Stream> streams;

        if (cursor == null) {
            streams = streamRepository.findByUserFirstPage(user, pageable);
        } else {
            streams = streamRepository.findByUserWithCursor(cursor, user, pageable);
        }

        return createPaginatedResponse(streams, limit);
    }

    public StreamResponse getStreamById(Long streamId) {
        log.info("Getting stream with ID: {}", streamId);
        Stream stream = streamRepository.findById(streamId)
                .orElseThrow(() -> new StreamNotFoundException(streamId));

        StreamResponse response = mapToStreamResponse(stream);
        response.setProtocol("RTMP"); // Hardcoded for now, could be dynamic in the future

        return response;
    }

    public StreamResponse updateStream(Long streamId, UpdateStreamRequest request, String username) {
        log.info("Updating stream with ID: {}", streamId);

        Stream stream = streamRepository.findById(streamId)
                .orElseThrow(() -> new StreamNotFoundException(streamId));

        // Check if the stream belongs to the user
        if (!stream.getUser().getUsername().equals(username)) {
            throw new StreamAccessDeniedException("You don't have permission to update this stream");
        }

        stream.setTitle(request.getTitle());
        stream.setDescription(request.getDescription());

        Stream updatedStream = streamRepository.save(stream);

        return mapToStreamResponse(updatedStream);
    }

    public void deleteStream(Long streamId, String username) {
        log.info("Deleting stream with ID: {}", streamId);

        Stream stream = streamRepository.findById(streamId)
                .orElseThrow(() -> new StreamNotFoundException(streamId));

        // Check if the stream belongs to the user
        if (!stream.getUser().getUsername().equals(username)) {
            throw new StreamAccessDeniedException("You don't have permission to delete this stream");
        }

        streamRepository.delete(stream);
        log.info("Stream deleted with ID: {}", streamId);
    }

    public PaginatedResponse<StreamResponse> getLiveStreams(Long cursor, int limit) {
        log.info("Getting all live streams with cursor: {} and limit: {}", cursor, limit);
        Pageable pageable = PageRequest.of(0, limit + 1); // Request one more item to determine if there are more items
        List<Stream> streams;

        if (cursor == null) {
            streams = streamRepository.findByStatusFirstPage(StreamStatus.LIVE, pageable);
        } else {
            streams = streamRepository.findByStatusWithCursor(cursor, StreamStatus.LIVE, pageable);
        }

        return createPaginatedResponse(streams, limit);
    }

    public PaginatedResponse<StreamResponse> getEndedStreams(Long cursor, int limit) {
        log.info("Getting all ended streams with cursor: {} and limit: {}", cursor, limit);
        Pageable pageable = PageRequest.of(0, limit + 1); // Request one more item to determine if there are more items
        List<Stream> streams;

        if (cursor == null) {
            streams = streamRepository.findByStatusFirstPage(StreamStatus.ENDED, pageable);
        } else {
            streams = streamRepository.findByStatusWithCursor(cursor, StreamStatus.ENDED, pageable);
        }

        return createPaginatedResponse(streams, limit);
    }

    public void setStreamStatusToLive(Long streamId) {
        log.info("Setting stream {} status to LIVE", streamId);
        Stream stream = streamRepository.findById(streamId)
                .orElseThrow(() -> new StreamNotFoundException(streamId));

        stream.setStatus(StreamStatus.LIVE);
        streamRepository.save(stream);
    }

    public void setStreamStatusToEnded(Long streamId) {
        log.info("Setting stream {} status to ENDED", streamId);
        Stream stream = streamRepository.findById(streamId)
                .orElseThrow(() -> new StreamNotFoundException(streamId));

        stream.setStatus(StreamStatus.ENDED);
        streamRepository.save(stream);
    }

    public StreamAccessResponse getStreamJwt(Long streamId, String username) {
        log.info("Getting JWT for stream with ID: {}", streamId);
        Stream stream = streamRepository.findById(streamId)
                .orElseThrow(() -> new StreamNotFoundException(streamId));

        // Check if the stream belongs to the user
        if (!stream.getUser().getUsername().equals(username)) {
            throw new StreamAccessDeniedException("You don't have permission to access this stream");
        }

        // Generate a new MediaMTX JWT token for this stream
        String mediamtxJwt = jwtTokenProvider.generateMediaMtxToken(stream.getId().intValue());
        String streamUrl = streamUrlBase;

        return new StreamAccessResponse(
            stream.getId(),
            streamUrl,
            mediamtxJwt
        );
    }

    private StreamResponse mapToStreamResponse(Stream stream) {
        return new StreamResponse(
                stream.getId(),
                stream.getTitle(),
                stream.getDescription(),
                stream.getStatus(),
                null // protocol is only set for single stream requests
        );
    }

    private PaginatedResponse<StreamResponse> createPaginatedResponse(List<Stream> streams, int limit) {
        boolean hasMore = streams.size() > limit;
        List<Stream> limitedStreams = hasMore ? streams.subList(0, limit) : streams;

        List<StreamResponse> responseItems = limitedStreams.stream()
                .map(this::mapToStreamResponse)
                .collect(Collectors.toList());

        Long nextCursor = null;
        if (hasMore && !limitedStreams.isEmpty()) {
            nextCursor = limitedStreams.get(limitedStreams.size() - 1).getId();
        }

        return new PaginatedResponse<>(responseItems, nextCursor, hasMore);
    }
}
