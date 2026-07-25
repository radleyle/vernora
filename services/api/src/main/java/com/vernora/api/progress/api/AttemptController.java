package com.vernora.api.progress.api;

import com.vernora.api.progress.api.dto.RecordAttemptRequest;
import com.vernora.api.progress.api.dto.RecordAttemptResponse;
import com.vernora.api.progress.application.ProgressService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AttemptController {

    private final ProgressService progressService;

    public AttemptController(ProgressService progressService) {
        this.progressService = progressService;
    }

    /**
     * Records one graded answer. Status codes tell the client what happened:
     * 201 Created for a new record, 200 OK when this attemptId was already
     * recorded (a retry) — same end state either way, which is the point of
     * idempotency.
     */
    @PostMapping("/v1/exercises/{exerciseId}/attempts")
    public ResponseEntity<RecordAttemptResponse> recordAttempt(
            @PathVariable String exerciseId,
            @Valid @RequestBody RecordAttemptRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        // Supabase's JWT subject is the user's UUID. Trusted because the
        // signature was already verified by the resource-server filter.
        var userId = UUID.fromString(jwt.getSubject());
        boolean created = progressService.recordAttempt(userId, exerciseId, request);
        return ResponseEntity.status(created ? HttpStatus.CREATED : HttpStatus.OK)
                .body(new RecordAttemptResponse(request.attemptId(), !created));
    }
}
