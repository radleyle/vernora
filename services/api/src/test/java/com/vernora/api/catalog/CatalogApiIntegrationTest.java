package com.vernora.api.catalog;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Boots the full application against a throwaway PostgreSQL container.
 * Flyway migrates it, we insert catalog rows, and we assert on real HTTP
 * behavior — the same wiring production uses, nothing mocked.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class CatalogApiIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:17-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcClient jdbc;

    @BeforeEach
    void resetCatalog() {
        jdbc.sql("delete from course_versions").update();
        jdbc.sql("delete from courses").update();
        insertCourse("korean-core", "ko");
        insertVersion("korean-core", 1, "PUBLISHED",
                """
                {"title": {"en": "Korean", "vi": "Tiếng Hàn"}}
                """);
    }

    @Test
    void listsPublishedCoursesWithLocalizedTitles() throws Exception {
        mockMvc.perform(get("/v1/courses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value("korean-core"))
                .andExpect(jsonPath("$[0].version").value(1))
                .andExpect(jsonPath("$[0].title.en").value("Korean"))
                .andExpect(jsonPath("$[0].title.vi").value("Tiếng Hàn"));
    }

    @Test
    void listServesOnlyTheLatestPublishedVersion() throws Exception {
        insertVersion("korean-core", 2, "PUBLISHED",
                """
                {"title": {"en": "Korean (revised)"}}
                """);
        insertVersion("korean-core", 3, "DRAFT",
                """
                {"title": {"en": "Korean (unpublished draft)"}}
                """);

        mockMvc.perform(get("/v1/courses"))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].version").value(2))
                .andExpect(jsonPath("$[0].title.en").value("Korean (revised)"));
    }

    @Test
    void servesTheFullCourseDocument() throws Exception {
        mockMvc.perform(get("/v1/courses/korean-core"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("korean-core"))
                .andExpect(jsonPath("$.language").value("ko"))
                .andExpect(jsonPath("$.content.title.en").value("Korean"));
    }

    @Test
    void unknownCourseYieldsSpecFormatted404() throws Exception {
        mockMvc.perform(get("/v1/courses/klingon"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("COURSE_NOT_FOUND"))
                .andExpect(jsonPath("$.correlationId").isNotEmpty());
    }

    private void insertCourse(String id, String language) {
        jdbc.sql("insert into courses (id, language) values (:id, :language)")
                .param("id", id)
                .param("language", language)
                .update();
    }

    private void insertVersion(String courseId, int version, String status, String content) {
        jdbc.sql("""
                        insert into course_versions (course_id, version, status, content, published_at)
                        values (:courseId, :version, :status, :content::jsonb,
                                case when :status = 'PUBLISHED' then now() end)
                        """)
                .param("courseId", courseId)
                .param("version", version)
                .param("status", status)
                .param("content", content)
                .update();
    }
}
