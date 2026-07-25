package com.vernora.api.progress.api.dto;

import java.time.Instant;
import java.util.List;

/**
 * Per-concept mastery for one user in one course, weakest first. The client
 * owns the course content, so it joins conceptId to the concept's title and
 * explanation for display.
 */
public record CourseMasteryResponse(String courseId, List<ConceptMasteryDto> concepts) {

    public record ConceptMasteryDto(
            String conceptId,
            int attempts,
            double recentAccuracy,
            int masteryScore,
            Instant lastAttemptAt) {}
}
