package com.vernora.api.phrases;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Covers the two uniqueness rules and the auth boundary. Scheduling and
 * grading live elsewhere; this module is a notebook.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class PhrasesApiIntegrationTest {

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
    void wipePhrases() {
        jdbc.sql("delete from saved_phrases").update();
    }

    @Test
    void savesAPhraseAndReturns201() throws Exception {
        mockMvc.perform(postPhrase(phraseJson(
                        "11111111-0000-4000-8000-000000000001", "안녕하세요"), asUser(USER)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.duplicate").value(false));

        Assertions.assertEquals(1, phraseRowCount());
    }

    @Test
    void replayingTheSamePhraseIdIsIdempotent() throws Exception {
        var body = phraseJson("11111111-0000-4000-8000-000000000002", "감사합니다");

        mockMvc.perform(postPhrase(body, asUser(USER))).andExpect(status().isCreated());
        mockMvc.perform(postPhrase(body, asUser(USER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.duplicate").value(true));

        Assertions.assertEquals(1, phraseRowCount());
    }

    @Test
    void savingTheSameKoreanWithANewIdIsStillOneRow() throws Exception {
        mockMvc.perform(postPhrase(phraseJson(
                        "11111111-0000-4000-8000-000000000003", "네"), asUser(USER)))
                .andExpect(status().isCreated());

        // Different phraseId, same Korean — set semantics, not a second card.
        mockMvc.perform(postPhrase(phraseJson(
                        "11111111-0000-4000-8000-000000000004", "네"), asUser(USER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.duplicate").value(true));

        Assertions.assertEquals(1, phraseRowCount());
    }

    @Test
    void listIsScopedToTheAuthenticatedUser() throws Exception {
        mockMvc.perform(postPhrase(phraseJson(
                        "11111111-0000-4000-8000-000000000005", "아니요"), asUser(USER)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/v1/saved-phrases").with(asUser(USER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phrases.length()").value(1))
                .andExpect(jsonPath("$.phrases[0].korean").value("아니요"));

        mockMvc.perform(get("/v1/saved-phrases").with(asUser(OTHER_USER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phrases.length()").value(0));
    }

    @Test
    void writesAndReadsRequireAuthentication() throws Exception {
        mockMvc.perform(post("/v1/saved-phrases")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(phraseJson(
                                "11111111-0000-4000-8000-000000000006", "안녕")))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/v1/saved-phrases")).andExpect(status().isUnauthorized());
    }

    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder postPhrase(
            String body, RequestPostProcessor auth) {
        return post("/v1/saved-phrases")
                .with(auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body);
    }

    private RequestPostProcessor asUser(String subject) {
        return jwt().jwt(token -> token.subject(subject));
    }

    private long phraseRowCount() {
        return jdbc.sql("select count(*) from saved_phrases").query(Long.class).single();
    }

    private String phraseJson(String phraseId, String korean) {
        return """
                {
                  "phraseId": "%s",
                  "korean": "%s",
                  "meaningEn": "hello",
                  "romanization": "annyeong",
                  "sourceCourseId": "korean-core",
                  "sourceLessonId": "greetings-and-introductions",
                  "clientCreatedAt": "2026-08-18T12:00:00Z"
                }
                """.formatted(phraseId, korean);
    }
}