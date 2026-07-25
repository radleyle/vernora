package com.vernora.api.progress;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Exercises the attempts write path and the derived-progress read path,
 * with special attention to the idempotency contract: submitting the same
 * attemptId twice must be safe and observable (201 then 200).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class ProgressApiIntegrationTest {

    private static final String USER = "2f9c1b34-0000-4000-8000-000000000001";
    private static final String OTHER_USER = "2f9c1b34-0000-4000-8000-000000000002";

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
    void recordsAnAttemptAndReturns201() throws Exception {
        mockMvc.perform(postAttempt("ex-greet-1", attemptJson(
                        "11111111-0000-4000-8000-000000000001", true), asUser(USER)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.duplicate").value(false));

        org.junit.jupiter.api.Assertions.assertEquals(1, attemptRowCount());
    }

    @Test
    void replayingTheSameAttemptIdIsIdempotent() throws Exception {
        var body = attemptJson("11111111-0000-4000-8000-000000000002", true);

        mockMvc.perform(postAttempt("ex-greet-1", body, asUser(USER)))
                .andExpect(status().isCreated());

        // Same request again — as a retry after a network timeout would be.
        mockMvc.perform(postAttempt("ex-greet-1", body, asUser(USER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.duplicate").value(true));

        org.junit.jupiter.api.Assertions.assertEquals(1, attemptRowCount());
    }

    private long attemptRowCount() {
        return jdbc.sql("select count(*) from exercise_attempts").query(Long.class).single();
    }

    @Test
    void progressAggregatesAcrossAttemptsAndNeverUncompletes() throws Exception {
        // Wrong, then right: everCorrect must be true (bool_or semantics).
        mockMvc.perform(postAttempt("ex-greet-1", attemptJson(
                        "11111111-0000-4000-8000-000000000003", false), asUser(USER)))
                .andExpect(status().isCreated());
        mockMvc.perform(postAttempt("ex-greet-1", attemptJson(
                        "11111111-0000-4000-8000-000000000004", true), asUser(USER)))
                .andExpect(status().isCreated());
        // Right, then wrong on a later retry: still complete.
        mockMvc.perform(postAttempt("ex-greet-2", attemptJson(
                        "11111111-0000-4000-8000-000000000005", true), asUser(USER)))
                .andExpect(status().isCreated());
        mockMvc.perform(postAttempt("ex-greet-2", attemptJson(
                        "11111111-0000-4000-8000-000000000006", false), asUser(USER)))
                .andExpect(status().isCreated());
        // Never correct so far.
        mockMvc.perform(postAttempt("ex-greet-3", attemptJson(
                        "11111111-0000-4000-8000-000000000007", false), asUser(USER)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/v1/courses/korean-core/progress").with(asUser(USER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.courseId").value("korean-core"))
                .andExpect(jsonPath("$.lessons.length()").value(1))
                .andExpect(jsonPath("$.lessons[0].lessonId").value("lesson-greetings"))
                .andExpect(jsonPath("$.lessons[0].exercises.length()").value(3))
                .andExpect(jsonPath("$.lessons[0].exercises[0].exerciseId").value("ex-greet-1"))
                .andExpect(jsonPath("$.lessons[0].exercises[0].everCorrect").value(true))
                .andExpect(jsonPath("$.lessons[0].exercises[1].everCorrect").value(true))
                .andExpect(jsonPath("$.lessons[0].exercises[2].everCorrect").value(false));
    }

    @Test
    void progressIsScopedToTheAuthenticatedUser() throws Exception {
        mockMvc.perform(postAttempt("ex-greet-1", attemptJson(
                        "11111111-0000-4000-8000-000000000008", true), asUser(USER)))
                .andExpect(status().isCreated());

        // A different user sees none of it.
        mockMvc.perform(get("/v1/courses/korean-core/progress").with(asUser(OTHER_USER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lessons.length()").value(0));
    }

    @Test
    void masteryDerivesConceptScoresFromTaggedAttempts() throws Exception {
        // One recognition success, one production failure, same concept.
        mockMvc.perform(postAttempt("ex-greet-1", attemptJson(
                        "11111111-0000-4000-8000-00000000000b", "LISTEN_AND_SELECT", true),
                        asUser(USER)))
                .andExpect(status().isCreated());
        mockMvc.perform(postAttempt("ex-greet-2", attemptJson(
                        "11111111-0000-4000-8000-00000000000c", "TRANSLATE_TO_KOREAN", false),
                        asUser(USER)))
                .andExpect(status().isCreated());

        // Weighted accuracy 1/(1+2) = 0.333; confidence 2/5 = 0.4 -> score 13.
        mockMvc.perform(get("/v1/courses/korean-core/mastery").with(asUser(USER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.concepts.length()").value(1))
                .andExpect(jsonPath("$.concepts[0].conceptId").value("greet-politely"))
                .andExpect(jsonPath("$.concepts[0].attempts").value(2))
                .andExpect(jsonPath("$.concepts[0].masteryScore").value(13));
    }

    @Test
    void masteryRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/v1/courses/korean-core/mastery"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void attemptsRequireAuthentication() throws Exception {
        mockMvc.perform(post("/v1/exercises/ex-greet-1/attempts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(attemptJson("11111111-0000-4000-8000-000000000009", true)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void progressRequiresAuthenticationDespitePublicCatalogWildcard() throws Exception {
        mockMvc.perform(get("/v1/courses/korean-core/progress"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void missingFieldsAreRejectedWith400() throws Exception {
        mockMvc.perform(postAttempt("ex-greet-1",
                        "{\"attemptId\": \"11111111-0000-4000-8000-00000000000a\"}",
                        asUser(USER)))
                .andExpect(status().isBadRequest());
    }

    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder postAttempt(
            String exerciseId, String body, RequestPostProcessor auth) {
        return post("/v1/exercises/{exerciseId}/attempts", exerciseId)
                .with(auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body);
    }

    private RequestPostProcessor asUser(String subject) {
        return jwt().jwt(token -> token.subject(subject));
    }

    private String attemptJson(String attemptId, boolean correct) {
        return attemptJson(attemptId, "LISTEN_AND_SELECT", correct);
    }

    private String attemptJson(String attemptId, String exerciseType, boolean correct) {
        return """
                {
                  "attemptId": "%s",
                  "courseId": "korean-core",
                  "lessonId": "lesson-greetings",
                  "exerciseType": "%s",
                  "conceptIds": ["greet-politely"],
                  "correct": %s,
                  "clientCreatedAt": "2026-07-24T12:00:00Z"
                }
                """.formatted(attemptId, exerciseType, correct);
    }
}
