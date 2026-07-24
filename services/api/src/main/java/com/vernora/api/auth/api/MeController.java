package com.vernora.api.auth.api;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Returns the identity of the calling user, derived exclusively from the
 * validated JWT. This is the pattern every authenticated endpoint will
 * follow: the user ID comes from the token's `sub` claim, never from a
 * request parameter or body (spec §25).
 */
@RestController
@RequestMapping("/v1/me")
public class MeController {

    public record MeResponse(String userId, String email) {
    }

    @GetMapping
    public MeResponse me(@AuthenticationPrincipal Jwt jwt) {
        return new MeResponse(jwt.getSubject(), jwt.getClaimAsString("email"));
    }
}
