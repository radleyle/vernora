package com.vernora.api.progress.infrastructure;

import com.vernora.api.progress.domain.MasteryCalculator.ConceptAttempt;
import java.sql.SQLException;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/**
 * Reads the attempt stream with concept tags for mastery derivation.
 * JdbcClient rather than JPA: this is a read model over the event stream,
 * and rs.getArray gives direct access to the text[] column.
 */
@Repository
public class ConceptAttemptReader {

    private final JdbcClient jdbc;

    public ConceptAttemptReader(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public List<ConceptAttempt> readHistory(UUID userId, String courseId) {
        return jdbc.sql(
                        """
                        select concept_ids, exercise_type, correct, created_at
                        from exercise_attempts
                        where user_id = :userId and course_id = :courseId
                        order by created_at, id
                        """)
                .param("userId", userId)
                .param("courseId", courseId)
                .query((rs, rowNum) -> {
                    String[] conceptIds;
                    try {
                        conceptIds = (String[]) rs.getArray("concept_ids").getArray();
                    } catch (SQLException e) {
                        throw new IllegalStateException("concept_ids is not a text[]", e);
                    }
                    return new ConceptAttempt(
                            List.of(conceptIds),
                            rs.getString("exercise_type"),
                            rs.getBoolean("correct"),
                            rs.getTimestamp("created_at").toInstant());
                })
                .list();
    }
}
