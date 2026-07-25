package com.vernora.api.progress.domain;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Set;

/**
 * Derives per-concept mastery from the attempt stream (spec §7.3).
 * Deterministic and explainable by design (§7.4: "explain this score in
 * plain language", §23.2: must not depend on AI). Every component of the
 * score is a sentence a learner could be shown:
 *
 * <ul>
 *   <li><b>Recent weighted accuracy</b> — how often you've been right
 *       lately (last {@value #RECENT_WINDOW} attempts), where <i>producing</i>
 *       Korean (translating, typing, speaking, building sentences) counts
 *       double compared to <i>recognizing</i> it (multiple choice, matching).
 *       Spec §7.3: production weighs more than recognition.
 *   <li><b>Confidence</b> — a concept needs at least
 *       {@value #FULL_CONFIDENCE_ATTEMPTS} attempts before a perfect streak
 *       can score 100; one lucky answer is not mastery.
 * </ul>
 *
 * <p>score = 100 × recentWeightedAccuracy × confidence, rounded.
 */
public final class MasteryCalculator {

    static final int RECENT_WINDOW = 10;
    static final int FULL_CONFIDENCE_ATTEMPTS = 5;
    static final double PRODUCTION_WEIGHT = 2.0;
    static final double RECOGNITION_WEIGHT = 1.0;

    /** Exercise types where the learner produces Korean rather than picks it. */
    private static final Set<String> PRODUCTION_TYPES =
            Set.of("TRANSLATE_TO_KOREAN", "FILL_BLANK", "FREE_RESPONSE", "SPEAK", "ARRANGE_TOKENS");

    private MasteryCalculator() {}

    /** One attempt's concept-relevant facts, oldest first. */
    public record ConceptAttempt(
            List<String> conceptIds, String exerciseType, boolean correct, Instant at) {}

    /** Derived mastery for one concept. */
    public record ConceptMastery(
            String conceptId,
            int attempts,
            /** Unweighted correct rate over the recent window, 0..1. */
            double recentAccuracy,
            /** 0..100; see class docs for the formula. */
            int masteryScore,
            Instant lastAttemptAt) {}

    public static List<ConceptMastery> calculate(List<ConceptAttempt> chronologicalHistory) {
        // Group the stream by concept; one attempt can feed several concepts.
        var byConcept = new LinkedHashMap<String, List<ConceptAttempt>>();
        for (var attempt : chronologicalHistory) {
            for (var conceptId : attempt.conceptIds()) {
                byConcept.computeIfAbsent(conceptId, key -> new ArrayList<>()).add(attempt);
            }
        }

        var result = new ArrayList<ConceptMastery>(byConcept.size());
        for (var entry : byConcept.entrySet()) {
            var attempts = entry.getValue();
            var recent = attempts.subList(Math.max(0, attempts.size() - RECENT_WINDOW), attempts.size());

            double weightedCorrect = 0;
            double weightedTotal = 0;
            int recentCorrect = 0;
            for (var attempt : recent) {
                double weight =
                        PRODUCTION_TYPES.contains(attempt.exerciseType())
                                ? PRODUCTION_WEIGHT
                                : RECOGNITION_WEIGHT;
                weightedTotal += weight;
                if (attempt.correct()) {
                    weightedCorrect += weight;
                    recentCorrect++;
                }
            }
            double weightedAccuracy = weightedTotal == 0 ? 0 : weightedCorrect / weightedTotal;
            double confidence =
                    Math.min(attempts.size(), FULL_CONFIDENCE_ATTEMPTS)
                            / (double) FULL_CONFIDENCE_ATTEMPTS;

            result.add(
                    new ConceptMastery(
                            entry.getKey(),
                            attempts.size(),
                            recent.isEmpty() ? 0 : (double) recentCorrect / recent.size(),
                            (int) Math.round(100 * weightedAccuracy * confidence),
                            attempts.get(attempts.size() - 1).at()));
        }
        // Weakest concepts first: that is what the learner (and later the
        // recommendation engine) most wants to see.
        result.sort(Comparator.comparingInt(ConceptMastery::masteryScore));
        return result;
    }
}
