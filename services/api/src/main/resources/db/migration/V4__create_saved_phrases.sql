-- Saved phrases: the learner's personal notebook (spec §8.3, §17.2).
--
-- First learner-generated dataset that is not append-only *history* but a
-- *set*: saving the same Korean twice should not create two notebook rows.
-- Hence two unique constraints with different jobs:
--   (user_id, phrase_id)  idempotency — a retried request cannot duplicate
--   (user_id, korean)     set semantics — re-saving from another screen
--                         lands on the same row (spec §18.4)
create table saved_phrases (
    id                bigint generated always as identity primary key,
    phrase_id         uuid        not null,
    user_id           uuid        not null,
    korean            text        not null,
    meaning_en        text        not null,
    romanization      text,
    -- Where the learner tapped Save; null when saved outside a lesson later.
    source_course_id  text,
    source_lesson_id  text,
    client_created_at timestamptz not null,
    created_at        timestamptz not null default now(),

    constraint uq_phrases_user_phrase unique (user_id, phrase_id),
    constraint uq_phrases_user_korean unique (user_id, korean)
);

-- The list screen: this user's phrases, newest first.
create index idx_phrases_user_created on saved_phrases (user_id, created_at desc);