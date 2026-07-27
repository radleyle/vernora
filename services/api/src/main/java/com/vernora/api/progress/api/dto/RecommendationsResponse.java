package com.vernora.api.progress.api.dto;

import java.time.Instant;
import java.util.List;

/**
 * Concepts worth deliberately reviewing, weakest first. The client owns
 * course content, so it joins conceptId to the concept's name/explanation
 * and to exercises tagged with it for a focused practice session.
 */
public record RecommendationsResponse(String courseId, List<RecommendedConcept> concepts) {

    public record RecommendedConcept(
            String conceptId, int masteryScore, int attempts, Instant lastAttemptAt) {}
}
