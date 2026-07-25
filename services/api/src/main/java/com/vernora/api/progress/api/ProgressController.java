package com.vernora.api.progress.api;

import com.vernora.api.progress.api.dto.CourseProgressResponse;
import com.vernora.api.progress.application.ProgressService;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProgressController {

    private final ProgressService progressService;

    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    /** The signed-in user's per-exercise progress in one course. */
    @GetMapping("/v1/courses/{courseId}/progress")
    public CourseProgressResponse getCourseProgress(
            @PathVariable String courseId, @AuthenticationPrincipal Jwt jwt) {
        var userId = UUID.fromString(jwt.getSubject());
        return progressService.getCourseProgress(userId, courseId);
    }
}
