package com.vernora.api.phrases.infrastructure;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SavedPhraseRepository extends JpaRepository<SavedPhraseEntity, Long> {

    /** Covers both "same request retried" and "same Korean re-saved". */
    boolean existsByUserIdAndPhraseId(UUID userId, UUID phraseId);

    boolean existsByUserIdAndKorean(UUID userId, String korean);

    List<SavedPhraseEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);
}