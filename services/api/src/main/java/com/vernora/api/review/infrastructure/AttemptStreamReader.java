package com.vernora.api.review.infrastructure;

import com.vernora.api.review.domain.ReviewScheduler.AttemptFact;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/**
 * Read-only view of the attempt stream for scheduling. The progress module
 * owns writes to exercise_attempts; the append-only stream itself is the
 * contract between modules, so review reads it directly rather than reaching
 * into progress's Java internals. Chronological order matters: the scheduler
 * folds history oldest-first.
 */
@Repository
public class AttemptStreamReader {

    private final JdbcClient jdbc;

    public AttemptStreamReader(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public List<AttemptFact> readHistory(UUID userId) {
        return jdbc.sql(
                        """
                        select exercise_id, course_id, lesson_id, correct, created_at
                        from exercise_attempts
                        where user_id = :userId
                        order by created_at, id
                        """)
                .param("userId", userId)
                .query((rs, rowNum) ->
                        new AttemptFact(
                                rs.getString("exercise_id"),
                                rs.getString("course_id"),
                                rs.getString("lesson_id"),
                                rs.getBoolean("correct"),
                                rs.getTimestamp("created_at").toInstant()))
                .list();
    }
}
