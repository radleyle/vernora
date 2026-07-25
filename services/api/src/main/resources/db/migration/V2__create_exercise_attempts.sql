-- Exercise attempts: append-only (spec §17.6). Rows are inserted, never
-- updated or deleted; progress and mastery are *derived* from them.
--
-- attempt_id is generated on the client (UUID). The unique constraint on
-- (user_id, attempt_id) is the idempotency guarantee: retrying the same
-- submission — flaky network, double click, future offline sync replay —
-- cannot create duplicate progress.

create table exercise_attempts (
    id                bigint generated always as identity primary key,
    attempt_id        uuid        not null,
    user_id           uuid        not null,
    course_id         text        not null,
    lesson_id         text        not null,
    exercise_id       text        not null,
    exercise_type     text        not null,
    correct           boolean     not null,
    client_created_at timestamptz not null,
    created_at        timestamptz not null default now(),

    constraint uq_attempts_user_attempt unique (user_id, attempt_id)
);

-- Progress per course/lesson is the hot query path.
create index idx_attempts_user_course on exercise_attempts (user_id, course_id, lesson_id);
