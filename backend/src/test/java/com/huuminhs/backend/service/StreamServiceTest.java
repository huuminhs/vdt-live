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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class StreamServiceTest {

    @Mock
    private StreamRepository streamRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private StreamService streamService;

    private User testUser;
    private Stream testStream;

    @BeforeEach
    void setUp() {
        // Set up test data
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setPassword("password");

        testStream = new Stream();
        testStream.setId(1L);
        testStream.setTitle("Test Stream");
        testStream.setDescription("Test Description");
        testStream.setCreatedAt(LocalDateTime.now());
        testStream.setStatus(StreamStatus.CREATED);
        testStream.setUser(testUser);

        // Set the base URL for streams
        ReflectionTestUtils.setField(streamService, "streamUrlBase", "rtmp://localhost/stream/");
    }

    @Test
    void createStream_Success() {
        // Arrange
        CreateStreamRequest request = new CreateStreamRequest("Test Stream", "Test Description");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(streamRepository.save(any(Stream.class))).thenReturn(testStream);
        when(jwtTokenProvider.generateMediaMtxToken(anyInt())).thenReturn("test-jwt-token");

        // Act
        StreamAccessResponse response = streamService.createStream(request, "testuser");

        // Assert
        assertNotNull(response);
        assertEquals(1L, response.getStreamId());
        assertEquals("rtmp://localhost/stream/", response.getStreamUrl());
        assertEquals("test-jwt-token", response.getMediamtxJwt());
        verify(streamRepository).save(any(Stream.class));
    }

    @Test
    void createStream_UserNotFound() {
        // Arrange
        CreateStreamRequest request = new CreateStreamRequest("Test Stream", "Test Description");
        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(UsernameNotFoundException.class, () -> {
            streamService.createStream(request, "nonexistent");
        });
        verify(streamRepository, never()).save(any(Stream.class));
    }

    @Test
    void getAllStreams_Success() {
        // Arrange
        Stream stream1 = new Stream(1L, "Stream 1", "Description 1", LocalDateTime.now(), StreamStatus.CREATED, testUser);
        Stream stream2 = new Stream(2L, "Stream 2", "Description 2", LocalDateTime.now(), StreamStatus.LIVE, testUser);
        when(streamRepository.findAllFirstPage(any())).thenReturn(Arrays.asList(stream1, stream2));

        // Act
        PaginatedResponse<StreamResponse> response = streamService.getAllStreams(null, 10);

        // Assert
        assertEquals(2, response.getItems().size());
        assertEquals("Stream 1", response.getItems().get(0).getTitle());
        assertEquals("Stream 2", response.getItems().get(1).getTitle());
        assertFalse(response.isHasMore());
    }

    @Test
    void getStreamsByUser_Success() {
        // Arrange
        Stream stream1 = new Stream(1L, "Stream 1", "Description 1", LocalDateTime.now(), StreamStatus.CREATED, testUser);
        Stream stream2 = new Stream(2L, "Stream 2", "Description 2", LocalDateTime.now(), StreamStatus.LIVE, testUser);
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(streamRepository.findByUserFirstPage(eq(testUser), any())).thenReturn(Arrays.asList(stream1, stream2));

        // Act
        PaginatedResponse<StreamResponse> response = streamService.getStreamsByUser("testuser", null, 10);

        // Assert
        assertEquals(2, response.getItems().size());
        assertEquals("Stream 1", response.getItems().get(0).getTitle());
        assertEquals("Stream 2", response.getItems().get(1).getTitle());
        assertFalse(response.isHasMore());
    }

    @Test
    void getStreamsByUser_UserNotFound() {
        // Arrange
        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(UsernameNotFoundException.class, () -> {
            streamService.getStreamsByUser("nonexistent", null, 10);
        });
        verify(streamRepository, never()).findByUserFirstPage(any(User.class), any());
    }

    @Test
    void getStreamById_Success() {
        // Arrange
        when(streamRepository.findById(1L)).thenReturn(Optional.of(testStream));

        // Act
        StreamResponse response = streamService.getStreamById(1L);

        // Assert
        assertNotNull(response);
        assertEquals(1L, response.getStreamId());
        assertEquals("Test Stream", response.getTitle());
        assertEquals("Test Description", response.getDescription());
        assertEquals(StreamStatus.CREATED, response.getStatus());
        assertEquals("RTMP", response.getProtocol());
    }

    @Test
    void getStreamById_NotFound() {
        // Arrange
        when(streamRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(StreamNotFoundException.class, () -> {
            streamService.getStreamById(999L);
        });
    }

    @Test
    void updateStream_Success() {
        // Arrange
        UpdateStreamRequest request = new UpdateStreamRequest("Updated Title", "Updated Description");
        when(streamRepository.findById(1L)).thenReturn(Optional.of(testStream));
        when(streamRepository.save(any(Stream.class))).thenReturn(testStream);

        // Act
        StreamResponse response = streamService.updateStream(1L, request, "testuser");

        // Assert
        assertNotNull(response);
        assertEquals(1L, response.getStreamId());
        assertEquals("Updated Title", testStream.getTitle());
        assertEquals("Updated Description", testStream.getDescription());
        verify(streamRepository).save(testStream);
    }

    @Test
    void updateStream_NotFound() {
        // Arrange
        UpdateStreamRequest request = new UpdateStreamRequest("Updated Title", "Updated Description");
        when(streamRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(StreamNotFoundException.class, () -> {
            streamService.updateStream(999L, request, "testuser");
        });
        verify(streamRepository, never()).save(any(Stream.class));
    }

    @Test
    void updateStream_AccessDenied() {
        // Arrange
        UpdateStreamRequest request = new UpdateStreamRequest("Updated Title", "Updated Description");
        when(streamRepository.findById(1L)).thenReturn(Optional.of(testStream));

        // Act & Assert
        assertThrows(StreamAccessDeniedException.class, () -> {
            streamService.updateStream(1L, request, "otheruser");
        });
        verify(streamRepository, never()).save(any(Stream.class));
    }

    @Test
    void deleteStream_Success() {
        // Arrange
        when(streamRepository.findById(1L)).thenReturn(Optional.of(testStream));

        // Act
        streamService.deleteStream(1L, "testuser");

        // Assert
        verify(streamRepository).delete(testStream);
    }

    @Test
    void deleteStream_NotFound() {
        // Arrange
        when(streamRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(StreamNotFoundException.class, () -> {
            streamService.deleteStream(999L, "testuser");
        });
        verify(streamRepository, never()).delete(any(Stream.class));
    }

    @Test
    void deleteStream_AccessDenied() {
        // Arrange
        when(streamRepository.findById(1L)).thenReturn(Optional.of(testStream));

        // Act & Assert
        assertThrows(StreamAccessDeniedException.class, () -> {
            streamService.deleteStream(1L, "otheruser");
        });
        verify(streamRepository, never()).delete(any(Stream.class));
    }

    @Test
    void getLiveStreams_Success() {
        // Arrange
        Stream stream1 = new Stream(1L, "Stream 1", "Description 1", LocalDateTime.now(), StreamStatus.LIVE, testUser);
        Stream stream2 = new Stream(2L, "Stream 2", "Description 2", LocalDateTime.now(), StreamStatus.LIVE, testUser);
        when(streamRepository.findByStatusFirstPage(eq(StreamStatus.LIVE), any())).thenReturn(Arrays.asList(stream1, stream2));

        // Act
        PaginatedResponse<StreamResponse> response = streamService.getLiveStreams(null, 10);

        // Assert
        assertEquals(2, response.getItems().size());
        assertEquals("Stream 1", response.getItems().get(0).getTitle());
        assertEquals("Stream 2", response.getItems().get(1).getTitle());
        assertEquals(StreamStatus.LIVE, response.getItems().get(0).getStatus());
        assertEquals(StreamStatus.LIVE, response.getItems().get(1).getStatus());
        assertFalse(response.isHasMore());
    }

    @Test
    void getEndedStreams_Success() {
        // Arrange
        Stream stream1 = new Stream(1L, "Stream 1", "Description 1", LocalDateTime.now(), StreamStatus.ENDED, testUser);
        Stream stream2 = new Stream(2L, "Stream 2", "Description 2", LocalDateTime.now(), StreamStatus.ENDED, testUser);
        when(streamRepository.findByStatusFirstPage(eq(StreamStatus.ENDED), any())).thenReturn(Arrays.asList(stream1, stream2));

        // Act
        PaginatedResponse<StreamResponse> response = streamService.getEndedStreams(null, 10);

        // Assert
        assertEquals(2, response.getItems().size());
        assertEquals("Stream 1", response.getItems().get(0).getTitle());
        assertEquals("Stream 2", response.getItems().get(1).getTitle());
        assertEquals(StreamStatus.ENDED, response.getItems().get(0).getStatus());
        assertEquals(StreamStatus.ENDED, response.getItems().get(1).getStatus());
        assertFalse(response.isHasMore());
    }

    @Test
    void setStreamStatusToLive_Success() {
        // Arrange
        when(streamRepository.findById(1L)).thenReturn(Optional.of(testStream));
        when(streamRepository.save(any(Stream.class))).thenReturn(testStream);

        // Act
        streamService.setStreamStatusToLive(1L);

        // Assert
        assertEquals(StreamStatus.LIVE, testStream.getStatus());
        verify(streamRepository).save(testStream);
    }

    @Test
    void setStreamStatusToLive_NotFound() {
        // Arrange
        when(streamRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(StreamNotFoundException.class, () -> {
            streamService.setStreamStatusToLive(999L);
        });
        verify(streamRepository, never()).save(any(Stream.class));
    }

    @Test
    void setStreamStatusToEnded_Success() {
        // Arrange
        when(streamRepository.findById(1L)).thenReturn(Optional.of(testStream));
        when(streamRepository.save(any(Stream.class))).thenReturn(testStream);

        // Act
        streamService.setStreamStatusToEnded(1L);

        // Assert
        assertEquals(StreamStatus.ENDED, testStream.getStatus());
        verify(streamRepository).save(testStream);
    }

    @Test
    void setStreamStatusToEnded_NotFound() {
        // Arrange
        when(streamRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(StreamNotFoundException.class, () -> {
            streamService.setStreamStatusToEnded(999L);
        });
        verify(streamRepository, never()).save(any(Stream.class));
    }

    @Test
    void getStreamJwt_Success() {
        // Arrange
        when(streamRepository.findById(1L)).thenReturn(Optional.of(testStream));
        when(jwtTokenProvider.generateMediaMtxToken(1)).thenReturn("test-jwt-token");

        // Act
        StreamAccessResponse response = streamService.getStreamJwt(1L, "testuser");

        // Assert
        assertNotNull(response);
        assertEquals(1L, response.getStreamId());
        assertEquals("rtmp://localhost/stream/", response.getStreamUrl());
        assertEquals("test-jwt-token", response.getMediamtxJwt());
        verify(jwtTokenProvider).generateMediaMtxToken(1);
    }

    @Test
    void getStreamJwt_NotFound() {
        // Arrange
        when(streamRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(StreamNotFoundException.class, () -> {
            streamService.getStreamJwt(999L, "testuser");
        });
        verify(jwtTokenProvider, never()).generateMediaMtxToken(anyInt());
    }

    @Test
    void getStreamJwt_AccessDenied() {
        // Arrange
        when(streamRepository.findById(1L)).thenReturn(Optional.of(testStream));

        // Act & Assert
        assertThrows(StreamAccessDeniedException.class, () -> {
            streamService.getStreamJwt(1L, "otheruser");
        });
        verify(jwtTokenProvider, never()).generateMediaMtxToken(anyInt());
    }
}
