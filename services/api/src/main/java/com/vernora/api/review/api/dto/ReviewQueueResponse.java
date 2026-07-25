package com.vernora.api.review.api.dto;

import java.time.Instant;
import java.util.List;

/** The user's due review items, most overdue first. */
public record ReviewQueueResponse(Instant generatedAt, List<ReviewItem> items) {

    public record ReviewItem(
            String exerciseId,
            String courseId,
            String lessonId,
            int streak,
            Instant dueAt) {}
}
