package com.vernora.api.progress.domain;

import com.vernora.api.progress.domain.MasteryCalculator.ConceptMastery;
import java.util.Comparator;
import java.util.List;

/**
 * Turns mastery scores into "review this" recommendations (spec Epic 5:
 * failed-concept recommendations; §8.2: mission feedback includes
 * recommended review items).
 *
 * <p>Deterministic by construction, same as {@link MasteryCalculator} and
 * {@link ReviewScheduler}: a recommendation is simply a concept whose score
 * falls below a plain-language threshold. Concepts the learner has never
 * attempted never appear here — {@link MasteryCalculator} only scores
 * concepts with evidence, so "not yet practiced" is correctly never
 * confused with "practiced and struggling". The spec's optional AI layer
 * (§23.1: "suggest a personalized review order") can later re-rank this
 * list; it must never be the only thing producing it (§23.2).
 */
public final class RecommendationEngine {

    /** Below this score a concept is considered worth deliberate review. */
    static final int NEEDS_REVIEW_THRESHOLD = 70;

    /** Cap so the learner sees a short, actionable list, not a wall of concepts. */
    static final int MAX_RECOMMENDATIONS = 5;

    private RecommendationEngine() {}

    /**
     * @param mastery any order; typically already weakest-first from
     *     {@link MasteryCalculator#calculate}
     * @return the weakest concepts under the threshold, weakest first,
     *     truncated to {@value #MAX_RECOMMENDATIONS}
     */
    public static List<ConceptMastery> recommend(List<ConceptMastery> mastery) {
        return mastery.stream()
                .filter(m -> m.masteryScore() < NEEDS_REVIEW_THRESHOLD)
                .sorted(Comparator.comparingInt(ConceptMastery::masteryScore))
                .limit(MAX_RECOMMENDATIONS)
                .toList();
    }
}
