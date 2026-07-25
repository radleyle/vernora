package com.vernora.api.review.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vernora.api.review.domain.ReviewScheduler.AttemptFact;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;

/**
 * Pure unit tests: no Spring, no database, milliseconds to run. This is the
 * payoff of keeping the scheduler framework-free — the whole spaced-
 * repetition policy is testable as plain input/output.
 */
class ReviewSchedulerTest {

    private static final Instant T0 = Instant.parse("2026-07-24T12:00:00Z");

    private AttemptFact attempt(String exerciseId, boolean correct, Instant at) {
        return new AttemptFact(exerciseId, "korean-core", "lesson-greetings", correct, at);
    }

    @Test
    void firstCorrectAnswerSchedulesOneDayOut() {
        var items = ReviewScheduler.schedule(List.of(attempt("ex-1", true, T0)));

        assertEquals(1, items.size());
        assertEquals(1, items.get(0).streak());
        assertEquals(T0.plus(Duration.ofDays(1)), items.get(0).dueAt());
    }

    @Test
    void streakClimbsTheIntervalLadder() {
        var items =
                ReviewScheduler.schedule(
                        List.of(
                                attempt("ex-1", true, T0),
                                attempt("ex-1", true, T0.plus(Duration.ofDays(1))),
                                attempt("ex-1", true, T0.plus(Duration.ofDays(4)))));

        // Streak 3 -> third rung -> 7 days after the latest attempt.
        assertEquals(3, items.get(0).streak());
        assertEquals(T0.plus(Duration.ofDays(4)).plus(Duration.ofDays(7)), items.get(0).dueAt());
    }

    @Test
    void aWrongAnswerResetsTheStreakAndComesBackInMinutes() {
        var items =
                ReviewScheduler.schedule(
                        List.of(
                                attempt("ex-1", true, T0),
                                attempt("ex-1", true, T0.plus(Duration.ofDays(1))),
                                attempt("ex-1", false, T0.plus(Duration.ofDays(4)))));

        assertEquals(0, items.get(0).streak());
        assertEquals(
                T0.plus(Duration.ofDays(4)).plus(Duration.ofMinutes(10)), items.get(0).dueAt());
    }

    @Test
    void streaksBeyondTheLadderStayAtTheLongestInterval() {
        var history =
                new java.util.ArrayList<AttemptFact>();
        for (int i = 0; i < 10; i++) {
            history.add(attempt("ex-1", true, T0.plus(Duration.ofDays(i))));
        }

        var items = ReviewScheduler.schedule(history);
        assertEquals(10, items.get(0).streak());
        assertEquals(
                T0.plus(Duration.ofDays(9)).plus(Duration.ofDays(35)), items.get(0).dueAt());
    }

    @Test
    void exercisesAreScheduledIndependently() {
        var items =
                ReviewScheduler.schedule(
                        List.of(
                                attempt("ex-1", true, T0),
                                attempt("ex-2", false, T0),
                                attempt("ex-1", true, T0.plus(Duration.ofDays(1)))));

        assertEquals(2, items.size());
        var ex1 = items.stream().filter(i -> i.exerciseId().equals("ex-1")).findFirst().orElseThrow();
        var ex2 = items.stream().filter(i -> i.exerciseId().equals("ex-2")).findFirst().orElseThrow();
        assertEquals(2, ex1.streak());
        assertEquals(0, ex2.streak());
    }

    @Test
    void dueFiltersAndSortsMostOverdueFirst() {
        var scheduled =
                ReviewScheduler.schedule(
                        List.of(
                                // Failed long ago: very overdue.
                                attempt("ex-old-fail", false, T0.minus(Duration.ofDays(3))),
                                // Correct 2 days ago with streak 1: due since yesterday.
                                attempt("ex-due", true, T0.minus(Duration.ofDays(2))),
                                // Correct just now: not due for a day.
                                attempt("ex-fresh", true, T0)));

        var due = ReviewScheduler.due(scheduled, T0);

        assertEquals(2, due.size());
        assertEquals("ex-old-fail", due.get(0).exerciseId());
        assertEquals("ex-due", due.get(1).exerciseId());
        assertTrue(due.stream().noneMatch(i -> i.exerciseId().equals("ex-fresh")));
    }
}
