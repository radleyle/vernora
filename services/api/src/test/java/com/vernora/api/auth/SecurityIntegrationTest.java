package com.vernora.api.auth;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Verifies the security boundary: which routes are public, which require a
 * valid token, and that identity is derived from the token's claims.
 *
 * jwt() fabricates an already-validated token inside the test, so these
 * tests cover authorization rules without needing Supabase. Signature
 * validation itself is Spring Security + Nimbus code we don't re-test.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class SecurityIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:17-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Test
    void courseCatalogIsPubliclyReadable() throws Exception {
        mockMvc.perform(get("/v1/courses"))
                .andExpect(status().isOk());
    }

    @Test
    void healthEndpointIsPublic() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
    }

    @Test
    void meRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/v1/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void meDerivesIdentityFromTokenClaims() throws Exception {
        mockMvc.perform(get("/v1/me").with(jwt().jwt(token -> token
                        .subject("2f9c1b34-0000-4000-8000-000000000001")
                        .claim("email", "learner@example.com"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value("2f9c1b34-0000-4000-8000-000000000001"))
                .andExpect(jsonPath("$.email").value("learner@example.com"));
    }
}
