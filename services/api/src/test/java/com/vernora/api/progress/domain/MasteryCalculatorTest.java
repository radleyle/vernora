package com.vernora.api.progress.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vernora.api.progress.domain.MasteryCalculator.ConceptAttempt;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

/** Spec §26.1 asks for mastery calculation unit tests explicitly. */
class MasteryCalculatorTest {

    private static final Instant T0 = Instant.parse("2026-07-24T12:00:00Z");

    private ConceptAttempt attempt(
            String concept, String type, boolean correct, int minutesAfterT0) {
        return new ConceptAttempt(
                List.of(concept), type, correct, T0.plus(Duration.ofMinutes(minutesAfterT0)));
    }

    @Test
    void oneCorrectAnswerIsNotMastery() {
        var mastery =
                MasteryCalculator.calculate(
                        List.of(attempt("politeness", "LISTEN_AND_SELECT", true, 0)));

        // Perfect accuracy but only 1 of 5 confidence attempts: 100 * 1.0 * 0.2
        assertEquals(20, mastery.get(0).masteryScore());
        assertEquals(1, mastery.get(0).attempts());
    }

    @Test
    void fiveCorrectAnswersReachFullScore() {
        var history = new ArrayList<ConceptAttempt>();
        for (int i = 0; i < 5; i++) {
            history.add(attempt("politeness", "LISTEN_AND_SELECT", true, i));
        }

        var mastery = MasteryCalculator.calculate(history);
        assertEquals(100, mastery.get(0).masteryScore());
    }

    @Test
    void productionFailuresHurtMoreThanRecognitionFailures() {
        // Same pattern: 4 correct recognition + 1 failure. Once the failure
        // is production (weight 2), the score must drop further.
        var recognitionFail =
                List.of(
                        attempt("greetings", "LISTEN_AND_SELECT", true, 0),
                        attempt("greetings", "LISTEN_AND_SELECT", true, 1),
                        attempt("greetings", "LISTEN_AND_SELECT", true, 2),
                        attempt("greetings", "LISTEN_AND_SELECT", true, 3),
                        attempt("greetings", "LISTEN_AND_SELECT", false, 4));
        var productionFail =
                List.of(
                        attempt("greetings", "LISTEN_AND_SELECT", true, 0),
                        attempt("greetings", "LISTEN_AND_SELECT", true, 1),
                        attempt("greetings", "LISTEN_AND_SELECT", true, 2),
                        attempt("greetings", "LISTEN_AND_SELECT", true, 3),
                        attempt("greetings", "TRANSLATE_TO_KOREAN", false, 4));

        int recognitionScore =
                MasteryCalculator.calculate(recognitionFail).get(0).masteryScore();
        int productionScore =
                MasteryCalculator.calculate(productionFail).get(0).masteryScore();

        assertEquals(80, recognitionScore); // 4/5 correct, equal weights
        assertEquals(67, productionScore); // 4/6 weighted
        assertTrue(productionScore < recognitionScore);
    }

    @Test
    void onlyTheRecentWindowCounts() {
        // 10 old failures followed by 10 recent successes: the old failures
        // scroll out of the window entirely.
        var history = new ArrayList<ConceptAttempt>();
        for (int i = 0; i < 10; i++) {
            history.add(attempt("numbers", "LISTEN_AND_SELECT", false, i));
        }
        for (int i = 10; i < 20; i++) {
            history.add(attempt("numbers", "LISTEN_AND_SELECT", true, i));
        }

        var mastery = MasteryCalculator.calculate(history);
        assertEquals(100, mastery.get(0).masteryScore());
        assertEquals(1.0, mastery.get(0).recentAccuracy());
        assertEquals(20, mastery.get(0).attempts());
    }

    @Test
    void oneAttemptFeedsAllItsTaggedConcepts() {
        var mastery =
                MasteryCalculator.calculate(
                        List.of(
                                new ConceptAttempt(
                                        List.of("greetings", "politeness"),
                                        "SPEAK",
                                        true,
                                        T0)));

        assertEquals(2, mastery.size());
    }

    @Test
    void weakestConceptsComeFirst() {
        var mastery =
                MasteryCalculator.calculate(
                        List.of(
                                attempt("strong", "LISTEN_AND_SELECT", true, 0),
                                attempt("strong", "LISTEN_AND_SELECT", true, 1),
                                attempt("weak", "LISTEN_AND_SELECT", false, 2)));

        assertEquals("weak", mastery.get(0).conceptId());
        assertEquals("strong", mastery.get(1).conceptId());
    }

    @Test
    void untaggedAttemptsContributeNothing() {
        var mastery =
                MasteryCalculator.calculate(
                        List.of(new ConceptAttempt(List.of(), "SPEAK", true, T0)));

        assertTrue(mastery.isEmpty());
    }
}
