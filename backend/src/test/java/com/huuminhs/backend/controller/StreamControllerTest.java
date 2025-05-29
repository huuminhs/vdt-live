package com.huuminhs.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.huuminhs.backend.dto.CreateStreamRequest;
import com.huuminhs.backend.dto.PaginatedResponse;
import com.huuminhs.backend.dto.StreamAccessResponse;
import com.huuminhs.backend.dto.StreamResponse;
import com.huuminhs.backend.dto.UpdateStreamRequest;
import com.huuminhs.backend.exception.StreamAccessDeniedException;
import com.huuminhs.backend.exception.StreamNotFoundException;
import com.huuminhs.backend.model.StreamStatus;
import com.huuminhs.backend.service.StreamService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class StreamControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private StreamService streamService;

    private CreateStreamRequest createStreamRequest;
    private StreamAccessResponse streamAccessResponse;
    private UpdateStreamRequest updateStreamRequest;
    private StreamResponse streamResponse;
    private List<StreamResponse> streamResponses;
    private PaginatedResponse<StreamResponse> paginatedStreamResponses;

    @BeforeEach
    void setUp() {
        // Set up test data
        createStreamRequest = new CreateStreamRequest("Test Stream", "Test Description");
        streamAccessResponse = new StreamAccessResponse(1L, "rtmp://localhost/stream/1", "test-jwt-token");
        updateStreamRequest = new UpdateStreamRequest("Updated Stream", "Updated Description");
        streamResponse = new StreamResponse(1L, "Test Stream", "Test Description", StreamStatus.CREATED, "RTMP");
        streamResponses = Arrays.asList(
                new StreamResponse(1L, "Stream 1", "Description 1", StreamStatus.CREATED, null),
                new StreamResponse(2L, "Stream 2", "Description 2", StreamStatus.LIVE, null)
        );
        paginatedStreamResponses = new PaginatedResponse<>(streamResponses, 2L, false);
    }

    @Test
    @WithMockUser(username = "testuser")
    void createStream_Success() throws Exception {
        // Arrange
        when(streamService.createStream(any(CreateStreamRequest.class), eq("testuser")))
                .thenReturn(streamAccessResponse);

        // Act & Assert
        mockMvc.perform(post("/api/stream")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createStreamRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.streamId", is(1)))
                .andExpect(jsonPath("$.streamUrl", is("rtmp://localhost/stream/1")))
                .andExpect(jsonPath("$.mediamtxJwt", is("test-jwt-token")));

        verify(streamService).createStream(any(CreateStreamRequest.class), eq("testuser"));
    }

    @Test
    void getAllStreams_Success() throws Exception {
        // Arrange
        when(streamService.getAllStreams(null, 10)).thenReturn(paginatedStreamResponses);

        // Act & Assert
        mockMvc.perform(get("/api/stream"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(2)))
                .andExpect(jsonPath("$.items[0].streamId", is(1)))
                .andExpect(jsonPath("$.items[0].title", is("Stream 1")))
                .andExpect(jsonPath("$.items[1].streamId", is(2)))
                .andExpect(jsonPath("$.items[1].title", is("Stream 2")))
                .andExpect(jsonPath("$.nextCursor", is(2)))
                .andExpect(jsonPath("$.hasMore", is(false)));

        verify(streamService).getAllStreams(null, 10);
    }

    @Test
    @WithMockUser(username = "testuser")
    void getMyStreams_Success() throws Exception {
        // Arrange
        when(streamService.getStreamsByUser(eq("testuser"), isNull(), eq(10))).thenReturn(paginatedStreamResponses);

        // Act & Assert
        mockMvc.perform(get("/api/stream/mine"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(2)))
                .andExpect(jsonPath("$.items[0].streamId", is(1)))
                .andExpect(jsonPath("$.items[0].title", is("Stream 1")))
                .andExpect(jsonPath("$.items[1].streamId", is(2)))
                .andExpect(jsonPath("$.items[1].title", is("Stream 2")))
                .andExpect(jsonPath("$.nextCursor", is(2)))
                .andExpect(jsonPath("$.hasMore", is(false)));

        verify(streamService).getStreamsByUser(eq("testuser"), isNull(), eq(10));
    }

    @Test
    void getStreamById_Success() throws Exception {
        // Arrange
        when(streamService.getStreamById(1L)).thenReturn(streamResponse);

        // Act & Assert
        mockMvc.perform(get("/api/stream/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.streamId", is(1)))
                .andExpect(jsonPath("$.title", is("Test Stream")))
                .andExpect(jsonPath("$.description", is("Test Description")))
                .andExpect(jsonPath("$.status", is("CREATED")))
                .andExpect(jsonPath("$.protocol", is("RTMP")));

        verify(streamService).getStreamById(1L);
    }

    @Test
    void getStreamById_NotFound() throws Exception {
        // Arrange
        when(streamService.getStreamById(999L)).thenThrow(new StreamNotFoundException(999L));

        // Act & Assert
        mockMvc.perform(get("/api/stream/999"))
                .andExpect(status().isNotFound());

        verify(streamService).getStreamById(999L);
    }

    @Test
    @WithMockUser(username = "testuser")
    void updateStream_Success() throws Exception {
        // Arrange
        when(streamService.updateStream(eq(1L), any(UpdateStreamRequest.class), eq("testuser")))
                .thenReturn(streamResponse);

        // Act & Assert
        mockMvc.perform(put("/api/stream/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateStreamRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.streamId", is(1)))
                .andExpect(jsonPath("$.title", is("Test Stream")))
                .andExpect(jsonPath("$.description", is("Test Description")));

        verify(streamService).updateStream(eq(1L), any(UpdateStreamRequest.class), eq("testuser"));
    }

    @Test
    @WithMockUser(username = "testuser")
    void updateStream_NotFound() throws Exception {
        // Arrange
        when(streamService.updateStream(eq(999L), any(UpdateStreamRequest.class), eq("testuser")))
                .thenThrow(new StreamNotFoundException(999L));

        // Act & Assert
        mockMvc.perform(put("/api/stream/999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateStreamRequest)))
                .andExpect(status().isNotFound());

        verify(streamService).updateStream(eq(999L), any(UpdateStreamRequest.class), eq("testuser"));
    }

    @Test
    @WithMockUser(username = "testuser")
    void updateStream_AccessDenied() throws Exception {
        // Arrange
        when(streamService.updateStream(eq(1L), any(UpdateStreamRequest.class), eq("testuser")))
                .thenThrow(new StreamAccessDeniedException("You don't have permission to update this stream"));

        // Act & Assert
        mockMvc.perform(put("/api/stream/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateStreamRequest)))
                .andExpect(status().isForbidden());

        verify(streamService).updateStream(eq(1L), any(UpdateStreamRequest.class), eq("testuser"));
    }

    @Test
    @WithMockUser(username = "testuser")
    void deleteStream_Success() throws Exception {
        // Arrange
        doNothing().when(streamService).deleteStream(1L, "testuser");

        // Act & Assert
        mockMvc.perform(delete("/api/stream/1"))
                .andExpect(status().isNoContent());

        verify(streamService).deleteStream(1L, "testuser");
    }

    @Test
    @WithMockUser(username = "testuser")
    void deleteStream_NotFound() throws Exception {
        // Arrange
        doThrow(new StreamNotFoundException(999L)).when(streamService).deleteStream(999L, "testuser");

        // Act & Assert
        mockMvc.perform(delete("/api/stream/999"))
                .andExpect(status().isNotFound());

        verify(streamService).deleteStream(999L, "testuser");
    }

    @Test
    @WithMockUser(username = "testuser")
    void deleteStream_AccessDenied() throws Exception {
        // Arrange
        doThrow(new StreamAccessDeniedException("You don't have permission to delete this stream"))
                .when(streamService).deleteStream(1L, "testuser");

        // Act & Assert
        mockMvc.perform(delete("/api/stream/1"))
                .andExpect(status().isForbidden());

        verify(streamService).deleteStream(1L, "testuser");
    }

    @Test
    void getLiveStreams_Success() throws Exception {
        // Arrange
        List<StreamResponse> liveStreams = Arrays.asList(
                new StreamResponse(2L, "Stream 2", "Description 2", StreamStatus.LIVE, null),
                new StreamResponse(3L, "Stream 3", "Description 3", StreamStatus.LIVE, null)
        );
        PaginatedResponse<StreamResponse> paginatedLiveStreams = new PaginatedResponse<>(liveStreams, 3L, false);
        when(streamService.getLiveStreams(isNull(), eq(10))).thenReturn(paginatedLiveStreams);

        // Act & Assert
        mockMvc.perform(get("/api/stream/live"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(2)))
                .andExpect(jsonPath("$.items[0].streamId", is(2)))
                .andExpect(jsonPath("$.items[0].title", is("Stream 2")))
                .andExpect(jsonPath("$.items[0].status", is("LIVE")))
                .andExpect(jsonPath("$.items[1].streamId", is(3)))
                .andExpect(jsonPath("$.items[1].title", is("Stream 3")))
                .andExpect(jsonPath("$.items[1].status", is("LIVE")))
                .andExpect(jsonPath("$.nextCursor", is(3)))
                .andExpect(jsonPath("$.hasMore", is(false)));

        verify(streamService).getLiveStreams(isNull(), eq(10));
    }

    @Test
    void getEndedStreams_Success() throws Exception {
        // Arrange
        List<StreamResponse> endedStreams = Arrays.asList(
                new StreamResponse(4L, "Stream 4", "Description 4", StreamStatus.ENDED, null),
                new StreamResponse(5L, "Stream 5", "Description 5", StreamStatus.ENDED, null)
        );
        PaginatedResponse<StreamResponse> paginatedEndedStreams = new PaginatedResponse<>(endedStreams, 5L, false);
        when(streamService.getEndedStreams(isNull(), eq(10))).thenReturn(paginatedEndedStreams);

        // Act & Assert
        mockMvc.perform(get("/api/stream/ended"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(2)))
                .andExpect(jsonPath("$.items[0].streamId", is(4)))
                .andExpect(jsonPath("$.items[0].title", is("Stream 4")))
                .andExpect(jsonPath("$.items[0].status", is("ENDED")))
                .andExpect(jsonPath("$.items[1].streamId", is(5)))
                .andExpect(jsonPath("$.items[1].title", is("Stream 5")))
                .andExpect(jsonPath("$.items[1].status", is("ENDED")))
                .andExpect(jsonPath("$.nextCursor", is(5)))
                .andExpect(jsonPath("$.hasMore", is(false)));

        verify(streamService).getEndedStreams(isNull(), eq(10));
    }

    @Test
    void setStreamStatusToLive_Success() throws Exception {
        // Arrange
        doNothing().when(streamService).setStreamStatusToLive(1L);

        // Act & Assert
        mockMvc.perform(put("/api/stream/1/live"))
                .andExpect(status().isOk());

        verify(streamService).setStreamStatusToLive(1L);
    }

    @Test
    void setStreamStatusToLive_NotFound() throws Exception {
        // Arrange
        doThrow(new StreamNotFoundException(999L)).when(streamService).setStreamStatusToLive(999L);

        // Act & Assert
        mockMvc.perform(put("/api/stream/999/live"))
                .andExpect(status().isNotFound());

        verify(streamService).setStreamStatusToLive(999L);
    }

    @Test
    void setStreamStatusToEnded_Success() throws Exception {
        // Arrange
        doNothing().when(streamService).setStreamStatusToEnded(1L);

        // Act & Assert
        mockMvc.perform(put("/api/stream/1/ended"))
                .andExpect(status().isOk());

        verify(streamService).setStreamStatusToEnded(1L);
    }

    @Test
    void setStreamStatusToEnded_NotFound() throws Exception {
        // Arrange
        doThrow(new StreamNotFoundException(999L)).when(streamService).setStreamStatusToEnded(999L);

        // Act & Assert
        mockMvc.perform(put("/api/stream/999/ended"))
                .andExpect(status().isNotFound());

        verify(streamService).setStreamStatusToEnded(999L);
    }

    @Test
    @WithMockUser(username = "testuser")
    void getStreamJwt_Success() throws Exception {
        // Arrange
        when(streamService.getStreamJwt(1L, "testuser")).thenReturn(streamAccessResponse);

        // Act & Assert
        mockMvc.perform(get("/api/stream/1/jwt"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.streamId", is(1)))
                .andExpect(jsonPath("$.streamUrl", is("rtmp://localhost/stream/1")))
                .andExpect(jsonPath("$.mediamtxJwt", is("test-jwt-token")));

        verify(streamService).getStreamJwt(1L, "testuser");
    }

    @Test
    @WithMockUser(username = "testuser")
    void getStreamJwt_NotFound() throws Exception {
        // Arrange
        when(streamService.getStreamJwt(999L, "testuser")).thenThrow(new StreamNotFoundException(999L));

        // Act & Assert
        mockMvc.perform(get("/api/stream/999/jwt"))
                .andExpect(status().isNotFound());

        verify(streamService).getStreamJwt(999L, "testuser");
    }

    @Test
    @WithMockUser(username = "testuser")
    void getStreamJwt_AccessDenied() throws Exception {
        // Arrange
        when(streamService.getStreamJwt(1L, "testuser"))
                .thenThrow(new StreamAccessDeniedException("You don't have permission to access this stream"));

        // Act & Assert
        mockMvc.perform(get("/api/stream/1/jwt"))
                .andExpect(status().isForbidden());

        verify(streamService).getStreamJwt(1L, "testuser");
    }
}
