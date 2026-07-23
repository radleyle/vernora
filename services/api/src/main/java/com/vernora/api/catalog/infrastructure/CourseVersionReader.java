package com.vernora.api.catalog.infrastructure;

import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/**
 * Read access to the content catalog.
 *
 * Published course content is an immutable JSONB document (ADR 0002), so
 * plain SQL is a better fit here than JPA entities: we never mutate these
 * rows, and Postgres can reach inside the document (content -> 'title') to
 * serve list queries without loading whole courses.
 */
@Repository
public class CourseVersionReader {

    private final JdbcClient jdbc;

    public CourseVersionReader(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public record CourseSummaryRow(
            String courseId, String language, int version, String titleEn, String titleVi) {
    }

    public record CourseContentRow(
            String courseId, String language, int version, String contentJson) {
    }

    /** Latest published version of each course. */
    public List<CourseSummaryRow> findLatestPublishedSummaries() {
        return jdbc.sql("""
                        select distinct on (cv.course_id)
                               cv.course_id,
                               c.language,
                               cv.version,
                               cv.content -> 'title' ->> 'en' as title_en,
                               cv.content -> 'title' ->> 'vi' as title_vi
                        from course_versions cv
                        join courses c on c.id = cv.course_id
                        where cv.status = 'PUBLISHED'
                        order by cv.course_id, cv.version desc
                        """)
                .query((rs, rowNum) -> new CourseSummaryRow(
                        rs.getString("course_id"),
                        rs.getString("language"),
                        rs.getInt("version"),
                        rs.getString("title_en"),
                        rs.getString("title_vi")))
                .list();
    }

    public Optional<CourseContentRow> findLatestPublishedContent(String courseId) {
        return jdbc.sql("""
                        select cv.course_id,
                               c.language,
                               cv.version,
                               cv.content::text as content
                        from course_versions cv
                        join courses c on c.id = cv.course_id
                        where cv.course_id = :courseId
                          and cv.status = 'PUBLISHED'
                        order by cv.version desc
                        limit 1
                        """)
                .param("courseId", courseId)
                .query((rs, rowNum) -> new CourseContentRow(
                        rs.getString("course_id"),
                        rs.getString("language"),
                        rs.getInt("version"),
                        rs.getString("content")))
                .optional();
    }
}
