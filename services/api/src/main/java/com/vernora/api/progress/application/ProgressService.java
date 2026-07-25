package com.vernora.api.progress.application;

import com.vernora.api.progress.api.dto.CourseMasteryResponse;
import com.vernora.api.progress.api.dto.CourseMasteryResponse.ConceptMasteryDto;
import com.vernora.api.progress.api.dto.CourseProgressResponse;
import com.vernora.api.progress.api.dto.CourseProgressResponse.ExerciseProgress;
import com.vernora.api.progress.api.dto.CourseProgressResponse.LessonProgress;
import com.vernora.api.progress.api.dto.RecordAttemptRequest;
import com.vernora.api.progress.domain.MasteryCalculator;
import com.vernora.api.progress.infrastructure.ConceptAttemptReader;
import com.vernora.api.progress.infrastructure.ExerciseAttemptEntity;
import com.vernora.api.progress.infrastructure.ExerciseAttemptRepository;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProgressService {

    private final ExerciseAttemptRepository attempts;
    private final ConceptAttemptReader conceptAttempts;

    public ProgressService(
            ExerciseAttemptRepository attempts, ConceptAttemptReader conceptAttempts) {
        this.attempts = attempts;
        this.conceptAttempts = conceptAttempts;
    }

    /**
     * Records an attempt idempotently. Two layers of duplicate defense:
     *
     * <ol>
     *   <li>A cheap existence check handles the common case (client retry
     *       after a timeout) without touching the unique index error path.
     *   <li>The database's unique (user_id, attempt_id) constraint is the
     *       real guarantee. If two identical requests race past the check
     *       simultaneously, one insert wins and the other throws
     *       DataIntegrityViolationException, which we translate to the same
     *       "duplicate" answer. Check-then-insert alone would be a TOCTOU
     *       race; the constraint makes it safe.
     * </ol>
     *
     * <p>Deliberately NOT @Transactional: if it were, the constraint violation
     * would poison the surrounding transaction (Spring marks it rollback-only)
     * and committing after our catch would fail. Without it, each repository
     * call runs in its own short transaction, so the failed insert rolls back
     * alone and the catch behaves as it reads. A single insert needs no
     * multi-statement atomicity anyway.
     *
     * @return true if this call created the record, false if it already existed
     */
    public boolean recordAttempt(UUID userId, String exerciseId, RecordAttemptRequest request) {
        if (attempts.existsByUserIdAndAttemptId(userId, request.attemptId())) {
            return false;
        }
        var entity =
                new ExerciseAttemptEntity(
                        request.attemptId(),
                        userId,
                        request.courseId(),
                        request.lessonId(),
                        exerciseId,
                        request.exerciseType(),
                        request.conceptIds().toArray(String[]::new),
                        request.correct(),
                        request.clientCreatedAt());
        try {
            attempts.saveAndFlush(entity);
            return true;
        } catch (DataIntegrityViolationException raceLoser) {
            return false;
        }
    }

    @Transactional(readOnly = true)
    public CourseMasteryResponse getCourseMastery(UUID userId, String courseId) {
        var mastery = MasteryCalculator.calculate(conceptAttempts.readHistory(userId, courseId));
        var concepts =
                mastery.stream()
                        .map(m ->
                                new ConceptMasteryDto(
                                        m.conceptId(),
                                        m.attempts(),
                                        m.recentAccuracy(),
                                        m.masteryScore(),
                                        m.lastAttemptAt()))
                        .toList();
        return new CourseMasteryResponse(courseId, concepts);
    }

    @Transactional(readOnly = true)
    public CourseProgressResponse getCourseProgress(UUID userId, String courseId) {
        var rows = attempts.findCourseProgress(userId, courseId);

        // Group flat rows into lessons, preserving query order.
        var byLesson = new LinkedHashMap<String, List<ExerciseProgress>>();
        for (var row : rows) {
            byLesson
                    .computeIfAbsent(row.getLessonId(), key -> new java.util.ArrayList<>())
                    .add(new ExerciseProgress(row.getExerciseId(), row.getEverCorrect()));
        }
        var lessons =
                byLesson.entrySet().stream()
                        .map(entry -> new LessonProgress(entry.getKey(), entry.getValue()))
                        .toList();
        return new CourseProgressResponse(courseId, lessons);
    }
}
