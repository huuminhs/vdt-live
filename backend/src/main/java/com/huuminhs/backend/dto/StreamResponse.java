package com.huuminhs.backend.dto;

import com.huuminhs.backend.model.StreamStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StreamResponse {
    private Long streamId;
    private String title;
    private String description;
    private StreamStatus status;

    // Username of the creator of the stream
    private String creator;
}
