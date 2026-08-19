package com.vernora.api.phrases.api.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record SavedPhrasesResponse(List<SavedPhraseDto> phrases) {

    public record SavedPhraseDto(
            UUID phraseId,
            String korean,
            String meaningEn,
            String romanization,
            String sourceCourseId,
            String sourceLessonId,
            Instant createdAt) {}
}