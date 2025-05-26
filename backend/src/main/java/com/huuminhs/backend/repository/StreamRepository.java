package com.huuminhs.backend.repository;

import com.huuminhs.backend.model.Stream;
import com.huuminhs.backend.model.StreamStatus;
import com.huuminhs.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StreamRepository extends JpaRepository<Stream, Long> {
    List<Stream> findByUser(User user);
    List<Stream> findByUserId(Long userId);
    Optional<Stream> findByTitle(String title);
    List<Stream> findByStatus(StreamStatus status);
}