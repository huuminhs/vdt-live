package com.huuminhs.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StreamAccessResponse {
    private Long streamId;
    private String streamUrl;
    private String mediamtxJwt;
}