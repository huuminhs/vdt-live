package com.huuminhs.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.FORBIDDEN)
public class StreamAccessDeniedException extends RuntimeException {
    public StreamAccessDeniedException(String message) {
        super(message);
    }
    
    public StreamAccessDeniedException() {
        super("You don't have permission to access this stream");
    }
}