package com.vernora.api.phrases.api;

import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.vernora.api.phrases.api.dto.SavePhraseRequest;
import com.vernora.api.phrases.api.dto.SavedPhrasesResponse;
import com.vernora.api.phrases.application.PhraseService;

import jakarta.validation.Valid;

@RestController
public class PhraseController {

    private final PhraseService phraseService;

    public PhraseController(PhraseService phraseService) {
        this.phraseService = phraseService;
    }

    /** 201 for a new save, 200 when it was already in the notebook. */
    @PostMapping("/v1/saved-phrases")
    public ResponseEntity<Map<String, Object>> save(
            @Valid @RequestBody SavePhraseRequest request, @AuthenticationPrincipal Jwt jwt) {
        var userId = UUID.fromString(jwt.getSubject());
        boolean created = phraseService.save(userId, request);
        return ResponseEntity.status(created ? HttpStatus.CREATED : HttpStatus.OK)
                .body(Map.of("phraseId", request.phraseId(), "duplicate", !created));
    }

    @GetMapping("/v1/saved-phrases")
    public SavedPhrasesResponse list(@AuthenticationPrincipal Jwt jwt) {
        return phraseService.list(UUID.fromString(jwt.getSubject()));
    }
}