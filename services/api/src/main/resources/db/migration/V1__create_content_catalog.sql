-- Content catalog: courses and their immutable published versions.
--
-- Published course content is stored as a JSONB document conforming to
-- @vernora/content-schema (ADR 0002): the backend serves it, the clients
-- render it, and nobody edits it in place — corrections produce a new
-- version row (ADR 0002 / spec §16.2).

create table courses (
    id         text primary key,
    language   text not null,
    created_at timestamptz not null default now()
);

create table course_versions (
    course_id    text not null references courses (id),
    version      integer not null,
    status       text not null check (status in ('DRAFT', 'PUBLISHED', 'RETIRED')),
    content      jsonb not null,
    published_at timestamptz,
    created_at   timestamptz not null default now(),
    primary key (course_id, version)
);

-- The learner app's main question: "latest published version of each course".
create index idx_course_versions_published
    on course_versions (course_id, version desc)
    where status = 'PUBLISHED';
