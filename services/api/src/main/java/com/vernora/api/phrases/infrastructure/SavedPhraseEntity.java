package com.vernora.api.phrases.infrastructure;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * One saved phrase in the learner's notebook. Unlike exercise attempts this
 * is a *set*, not a log: the two unique constraints (user_id+phrase_id,
 * user_id+korean) live in V4 and the service treats a violation of either
 * as "already saved".
 */
@Entity
@Table(name = "saved_phrases")
public class SavedPhraseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "phrase_id", nullable = false)
    private UUID phraseId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String korean;

    @Column(name = "meaning_en", nullable = false)
    private String meaningEn;

    private String romanization;

    @Column(name = "source_course_id")
    private String sourceCourseId;

    @Column(name = "source_lesson_id")
    private String sourceLessonId;

    @Column(name = "client_created_at", nullable = false)
    private Instant clientCreatedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected SavedPhraseEntity() {
        // JPA requires a no-arg constructor.
    }

    public SavedPhraseEntity(
            UUID phraseId,
            UUID userId,
            String korean,
            String meaningEn,
            String romanization,
            String sourceCourseId,
            String sourceLessonId,
            Instant clientCreatedAt) {
        this.phraseId = phraseId;
        this.userId = userId;
        this.korean = korean;
        this.meaningEn = meaningEn;
        this.romanization = romanization;
        this.sourceCourseId = sourceCourseId;
        this.sourceLessonId = sourceLessonId;
        this.clientCreatedAt = clientCreatedAt;
        this.createdAt = Instant.now();
    }

    public UUID getPhraseId() {
        return phraseId;
    }

    public String getKorean() {
        return korean;
    }

    public String getMeaningEn() {
        return meaningEn;
    }

    public String getRomanization() {
        return romanization;
    }

    public String getSourceCourseId() {
        return sourceCourseId;
    }

    public String getSourceLessonId() {
        return sourceLessonId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}