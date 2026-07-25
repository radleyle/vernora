package com.vernora.api.progress.infrastructure;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Spring Data JPA repository: declare the interface, Spring generates the
 * implementation at startup. Method names like existsByUserIdAndAttemptId
 * are parsed into queries ("derived queries").
 */
public interface ExerciseAttemptRepository extends JpaRepository<ExerciseAttemptEntity, Long> {

    boolean existsByUserIdAndAttemptId(UUID userId, UUID attemptId);

    /**
     * Progress is derived, not stored: for each exercise the user touched in
     * this course, has any attempt ever been correct? bool_or is Postgres's
     * "OR across the group", so one wrong retry never un-completes an
     * exercise. Native SQL because JPQL has no bool_or; the quoted aliases
     * must match the projection interface's getter names.
     */
    @Query(
            value =
                    """
                    select lesson_id as "lessonId",
                           exercise_id as "exerciseId",
                           bool_or(correct) as "everCorrect"
                    from exercise_attempts
                    where user_id = :userId and course_id = :courseId
                    group by lesson_id, exercise_id
                    order by lesson_id, exercise_id
                    """,
            nativeQuery = true)
    List<ExerciseProgressRow> findCourseProgress(
            @Param("userId") UUID userId, @Param("courseId") String courseId);

    /** Interface-based projection: Spring maps query aliases to these getters. */
    interface ExerciseProgressRow {
        String getLessonId();

        String getExerciseId();

        boolean getEverCorrect();
    }
}
