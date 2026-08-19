package com.vernora.api.phrases.api.dto;

import java.time.Instant;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Client-generated phraseId makes the save retryable: resubmitting after a
 * timeout hits the unique constraint instead of creating a second row.
 */
public record SavePhraseRequest(
        @NotNull UUID phraseId,
        @NotBlank String korean,
        @NotBlank String meaningEn,
        String romanization,
        String sourceCourseId,
        String sourceLessonId,
        @NotNull Instant clientCreatedAt) {}