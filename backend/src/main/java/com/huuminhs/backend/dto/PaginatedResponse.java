package com.huuminhs.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaginatedResponse<T> {
    private List<T> items;
    private Long nextCursor;
    private boolean hasMore;
    
    public static <T> PaginatedResponse<T> of(List<T> items, Long nextCursor, boolean hasMore) {
        return new PaginatedResponse<>(items, nextCursor, hasMore);
    }
}