package com.vernora.api.progress.api.dto;

import java.util.UUID;

/** duplicate=true means this attemptId was already recorded; nothing changed. */
public record RecordAttemptResponse(UUID attemptId, boolean duplicate) {}
