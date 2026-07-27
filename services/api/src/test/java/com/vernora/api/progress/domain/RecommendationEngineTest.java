package com.vernora.api.progress.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vernora.api.progress.domain.MasteryCalculator.ConceptMastery;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

class RecommendationEngineTest {

    private static final Instant T0 = Instant.parse("2026-07-24T12:00:00Z");

    private ConceptMastery mastery(String conceptId, int score) {
        return new ConceptMastery(conceptId, 3, score / 100.0, score, T0);
    }

    @Test
    void concernedConceptsBelowThresholdAreRecommended() {
        var recommendations =
                RecommendationEngine.recommend(
                        List.of(mastery("weak", 40), mastery("strong", 90)));

        assertEquals(1, recommendations.size());
        assertEquals("weak", recommendations.get(0).conceptId());
    }

    @Test
    void scoreExactlyAtThresholdIsNotRecommended() {
        // 70 means "doing fine"; only strictly-below counts as needing review.
        var recommendations = RecommendationEngine.recommend(List.of(mastery("borderline", 70)));

        assertTrue(recommendations.isEmpty());
    }

    @Test
    void resultsAreWeakestFirstRegardlessOfInputOrder() {
        var recommendations =
                RecommendationEngine.recommend(
                        List.of(mastery("medium-weak", 60), mastery("very-weak", 10)));

        assertEquals("very-weak", recommendations.get(0).conceptId());
        assertEquals("medium-weak", recommendations.get(1).conceptId());
    }

    @Test
    void truncatesToFiveEvenWithManyWeakConcepts() {
        var many = new ArrayList<ConceptMastery>();
        for (int i = 0; i < 8; i++) {
            many.add(mastery("concept-" + i, 10 + i));
        }

        var recommendations = RecommendationEngine.recommend(many);

        assertEquals(5, recommendations.size());
        assertEquals("concept-0", recommendations.get(0).conceptId());
        assertEquals("concept-4", recommendations.get(4).conceptId());
    }

    @Test
    void noWeakConceptsMeansNoRecommendations() {
        var recommendations = RecommendationEngine.recommend(List.of(mastery("solid", 95)));

        assertTrue(recommendations.isEmpty());
    }
}
