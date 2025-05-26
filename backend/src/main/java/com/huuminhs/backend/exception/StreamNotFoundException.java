package com.huuminhs.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class StreamNotFoundException extends RuntimeException {
    public StreamNotFoundException(Long streamId) {
        super("Stream not found with ID: " + streamId);
    }
}