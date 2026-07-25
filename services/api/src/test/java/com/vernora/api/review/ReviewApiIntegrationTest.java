package com.vernora.api.review;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * The queue endpoint end to end: attempts go in (inserted with controlled
 * timestamps, something the HTTP API rightly does not allow), due items come
 * out. The scheduling policy itself is covered by ReviewSchedulerTest; here
 * we verify the wiring — SQL, ordering, auth, response shape.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class ReviewApiIntegrationTest {

    private static final String USER = "2f9c1b34-0000-4000-8000-000000000001";

    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:17-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcClient jdbc;

    @BeforeEach
    void wipeAttempts() {
        jdbc.sql("delete from exercise_attempts").update();
    }

    @Test
    void queueContainsOverdueItemsMostOverdueFirst() throws Exception {
        // Failed 3 days ago: overdue since ~3 days (10-minute retry delay).
        insertAttempt(USER, "ex-failed-long-ago", false, 3);
        // Correct 2 days ago, streak 1 = 1-day interval: overdue since yesterday.
        insertAttempt(USER, "ex-due-yesterday", true, 2);
        // Correct today: due tomorrow, not in the queue.
        insertAttempt(USER, "ex-fresh", true, 0);

        mockMvc.perform(get("/v1/reviews/due").with(asUser(USER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.items[0].exerciseId").value("ex-failed-long-ago"))
                .andExpect(jsonPath("$.items[0].streak").value(0))
                .andExpect(jsonPath("$.items[1].exerciseId").value("ex-due-yesterday"))
                .andExpect(jsonPath("$.items[1].streak").value(1))
                .andExpect(jsonPath("$.items[1].courseId").value("korean-core"))
                .andExpect(jsonPath("$.items[1].lessonId").value("lesson-greetings"));
    }

    @Test
    void answeringCorrectlyRemovesTheItemFromTheQueue() throws Exception {
        insertAttempt(USER, "ex-1", false, 1);

        mockMvc.perform(get("/v1/reviews/due").with(asUser(USER)))
                .andExpect(jsonPath("$.items.length()").value(1));

        // The learner reviews it successfully "now" — streak 1, due tomorrow.
        insertAttempt(USER, "ex-1", true, 0);

        mockMvc.perform(get("/v1/reviews/due").with(asUser(USER)))
                .andExpect(jsonPath("$.items.length()").value(0));
    }

    @Test
    void queueIsScopedToTheAuthenticatedUser() throws Exception {
        insertAttempt(USER, "ex-1", false, 1);

        mockMvc.perform(get("/v1/reviews/due")
                        .with(asUser("2f9c1b34-0000-4000-8000-000000000002")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(0));
    }

    @Test
    void queueRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/v1/reviews/due"))
                .andExpect(status().isUnauthorized());
    }

    private org.springframework.test.web.servlet.request.RequestPostProcessor asUser(
            String subject) {
        return jwt().jwt(token -> token.subject(subject));
    }

    private void insertAttempt(String userId, String exerciseId, boolean correct, int daysAgo) {
        jdbc.sql(
                        """
                        insert into exercise_attempts
                            (attempt_id, user_id, course_id, lesson_id, exercise_id,
                             exercise_type, correct, client_created_at, created_at)
                        values
                            (:attemptId, :userId, 'korean-core', 'lesson-greetings', :exerciseId,
                             'listen_and_select', :correct, :at, :at)
                        """)
                .param("attemptId", UUID.randomUUID())
                .param("userId", UUID.fromString(userId))
                .param("exerciseId", exerciseId)
                .param("correct", correct)
                .param("at", java.time.OffsetDateTime.now().minus(daysAgo, ChronoUnit.DAYS))
                .update();
    }
}
