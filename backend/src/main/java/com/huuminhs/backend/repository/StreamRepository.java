package com.huuminhs.backend.repository;

import com.huuminhs.backend.model.Stream;
import com.huuminhs.backend.model.StreamStatus;
import com.huuminhs.backend.model.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StreamRepository extends JpaRepository<Stream, Long> {
    List<Stream> findByUser(User user);
    List<Stream> findByUserId(Long userId);
    Optional<Stream> findByTitle(String title);
    List<Stream> findByStatus(StreamStatus status);

    // Cursor-based pagination methods
    @Query("SELECT s FROM Stream s WHERE s.id > :cursor ORDER BY s.id ASC")
    List<Stream> findAllWithCursor(@Param("cursor") Long cursor, Pageable pageable);

    @Query("SELECT s FROM Stream s WHERE s.id > :cursor AND s.user = :user ORDER BY s.id ASC")
    List<Stream> findByUserWithCursor(@Param("cursor") Long cursor, @Param("user") User user, Pageable pageable);

    @Query("SELECT s FROM Stream s WHERE s.id > :cursor AND s.status = :status ORDER BY s.id ASC")
    List<Stream> findByStatusWithCursor(@Param("cursor") Long cursor, @Param("status") StreamStatus status, Pageable pageable);

    // Methods for first page (no cursor)
    @Query("SELECT s FROM Stream s ORDER BY s.id ASC")
    List<Stream> findAllFirstPage(Pageable pageable);

    @Query("SELECT s FROM Stream s WHERE s.user = :user ORDER BY s.id ASC")
    List<Stream> findByUserFirstPage(@Param("user") User user, Pageable pageable);

    @Query("SELECT s FROM Stream s WHERE s.status = :status ORDER BY s.id ASC")
    List<Stream> findByStatusFirstPage(@Param("status") StreamStatus status, Pageable pageable);
}
