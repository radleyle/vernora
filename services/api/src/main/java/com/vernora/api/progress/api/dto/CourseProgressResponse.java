package com.vernora.api.progress.api.dto;

import java.util.List;

/**
 * Per-exercise completion state for one user in one course, grouped by
 * lesson. The server reports facts; the client owns the course content, so
 * it decides what "lesson complete" means (all exercises everCorrect).
 */
public record CourseProgressResponse(String courseId, List<LessonProgress> lessons) {

    public record LessonProgress(String lessonId, List<ExerciseProgress> exercises) {}

    public record ExerciseProgress(String exerciseId, boolean everCorrect) {}
}
