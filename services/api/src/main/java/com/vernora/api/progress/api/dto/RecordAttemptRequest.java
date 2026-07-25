package com.vernora.api.progress.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

/**
 * What the client sends when submitting a graded answer. Deliberately absent:
 * userId (derived from the JWT) and exerciseId (taken from the URL path).
 *
 * <p>Bean Validation annotations run before the controller method executes;
 * a violation short-circuits to a 400 response.
 */
public record RecordAttemptRequest(
        @NotNull UUID attemptId,
        @NotBlank String courseId,
        @NotBlank String lessonId,
        @NotBlank String exerciseType,
        @NotNull Boolean correct,
        @NotNull Instant clientCreatedAt) {}
