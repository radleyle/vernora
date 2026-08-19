package com.vernora.api.phrases.application;

import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import com.vernora.api.phrases.api.dto.SavePhraseRequest;
import com.vernora.api.phrases.api.dto.SavedPhrasesResponse;
import com.vernora.api.phrases.api.dto.SavedPhrasesResponse.SavedPhraseDto;
import com.vernora.api.phrases.infrastructure.SavedPhraseEntity;
import com.vernora.api.phrases.infrastructure.SavedPhraseRepository;

@Service
public class PhraseService {

    private final SavedPhraseRepository phrases;

    public PhraseService(SavedPhraseRepository phrases) {
        this.phrases = phrases;
    }

    /**
     * Saves idempotently, with set semantics. Same pattern as
     * ProgressService.recordAttempt and deliberately NOT @Transactional:
     * a caught constraint violation inside a transaction would mark it
     * rollback-only and the commit would then fail. Each repository call
     * runs in its own short transaction instead.
     *
     * @return true if a new row was created, false if it already existed
     *     (either the same phraseId retried, or the same Korean re-saved)
     */
    public boolean save(UUID userId, SavePhraseRequest request) {
        if (phrases.existsByUserIdAndPhraseId(userId, request.phraseId())
                || phrases.existsByUserIdAndKorean(userId, request.korean())) {
            return false;
        }
        var entity =
                new SavedPhraseEntity(
                        request.phraseId(),
                        userId,
                        request.korean(),
                        request.meaningEn(),
                        request.romanization(),
                        request.sourceCourseId(),
                        request.sourceLessonId(),
                        request.clientCreatedAt());
        try {
            phrases.saveAndFlush(entity);
            return true;
        } catch (DataIntegrityViolationException raceLoser) {
            // Two devices raced past the existence checks; one insert won.
            return false;
        }
    }

    public SavedPhrasesResponse list(UUID userId) {
        var rows =
                phrases.findByUserIdOrderByCreatedAtDesc(userId).stream()
                        .map(
                                row ->
                                        new SavedPhraseDto(
                                                row.getPhraseId(),
                                                row.getKorean(),
                                                row.getMeaningEn(),
                                                row.getRomanization(),
                                                row.getSourceCourseId(),
                                                row.getSourceLessonId(),
                                                row.getCreatedAt()))
                        .toList();
        return new SavedPhrasesResponse(rows);
    }
}