package com.vernora.api.review.domain;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;

/**
 * Deterministic spaced-repetition scheduling (spec §23.2: review scheduling
 * must not depend on AI). A pure function over the append-only attempt
 * stream: given a user's full attempt history, compute when each exercise is
 * next due. Nothing is stored; the schedule is re-derived on demand, exactly
 * like lesson progress.
 *
 * <p>The algorithm is a Leitner ladder, the honest binary-grading cousin of
 * SM-2 (which needs a 0-5 self-assessed quality score we don't collect):
 *
 * <ul>
 *   <li>Each consecutive correct answer climbs one rung; the interval to the
 *       next review roughly doubles per rung (1, 3, 7, 16, 35 days).
 *   <li>One wrong answer resets the streak; the item comes back in 10
 *       minutes. Mistakes resurface fast, mastered items fade back.
 * </ul>
 *
 * <p>Pure and framework-free by design: no Spring, no clock, no I/O. Time is
 * a parameter, which makes tests trivial and behavior reproducible.
 */
public final class ReviewScheduler {

    /** A failed item returns almost immediately. */
    static final Duration RETRY_DELAY = Duration.ofMinutes(10);

    /** Interval per streak rung; streaks beyond the last rung stay at 35 days. */
    static final List<Duration> INTERVALS =
            List.of(
                    Duration.ofDays(1),
                    Duration.ofDays(3),
                    Duration.ofDays(7),
                    Duration.ofDays(16),
                    Duration.ofDays(35));

    private ReviewScheduler() {}

    /** One row from the attempt stream, oldest first. */
    public record AttemptFact(
            String exerciseId, String courseId, String lessonId, boolean correct, Instant at) {}

    /** The derived schedule for one exercise. */
    public record ScheduledItem(
            String exerciseId,
            String courseId,
            String lessonId,
            int streak,
            Instant lastAttemptAt,
            Instant dueAt) {}

    /**
     * Folds a chronological attempt history into one schedule entry per
     * exercise. Only exercises the user has actually attempted are scheduled;
     * unseen material belongs to lessons, not reviews.
     */
    public static List<ScheduledItem> schedule(List<AttemptFact> chronologicalHistory) {
        // Working state per exercise: current streak and latest attempt time.
        record State(int streak, Instant lastAt) {}
        var states = new LinkedHashMap<String, State>();
        var identity = new LinkedHashMap<String, AttemptFact>();

        for (var fact : chronologicalHistory) {
            var key = fact.courseId() + "/" + fact.exerciseId();
            var previous = states.get(key);
            int streak = fact.correct() ? (previous == null ? 1 : previous.streak() + 1) : 0;
            states.put(key, new State(streak, fact.at()));
            identity.put(key, fact);
        }

        var items = new ArrayList<ScheduledItem>(states.size());
        for (var entry : states.entrySet()) {
            var state = entry.getValue();
            var fact = identity.get(entry.getKey());
            var interval =
                    state.streak() == 0
                            ? RETRY_DELAY
                            : INTERVALS.get(Math.min(state.streak() - 1, INTERVALS.size() - 1));
            items.add(
                    new ScheduledItem(
                            fact.exerciseId(),
                            fact.courseId(),
                            fact.lessonId(),
                            state.streak(),
                            state.lastAt(),
                            state.lastAt().plus(interval)));
        }
        return items;
    }

    /** Items due at {@code now}, most overdue first. */
    public static List<ScheduledItem> due(List<ScheduledItem> allItems, Instant now) {
        return allItems.stream()
                .filter(item -> !item.dueAt().isAfter(now))
                .sorted(Comparator.comparing(ScheduledItem::dueAt))
                .toList();
    }
}
