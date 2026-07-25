package com.vernora.api.review.api;

import com.vernora.api.review.api.dto.ReviewQueueResponse;
import com.vernora.api.review.application.ReviewService;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * GET /v1/reviews/due (spec §16). There is deliberately no "complete a
 * review" write endpoint yet: answering a review item IS submitting an
 * attempt via POST /v1/exercises/{id}/attempts, which reschedules the item
 * on the next queue read. One write path, one source of truth.
 */
@RestController
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/v1/reviews/due")
    public ReviewQueueResponse getDueReviews(@AuthenticationPrincipal Jwt jwt) {
        return reviewService.getDueReviews(UUID.fromString(jwt.getSubject()));
    }
}
