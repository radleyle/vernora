# ADR 0002: Content schema as a shared Zod package

**Status:** Accepted
**Date:** 2026-07-23

## Context

Course content flows through every part of the system: the admin dashboard
authors it, the backend stores and serves it, and the mobile app caches it in
SQLite and renders it offline. All three need to agree on its structure, and
disagreement would surface as runtime bugs on learners' devices.

## Decision

1. Content structure is defined once in `packages/content-schema` using
   **Zod** schemas, with TypeScript types inferred from them (`z.infer`).
2. Validation has two layers: Zod proves the *shape* is right (structural),
   and `validateCourseReferences` proves the document makes *sense* —
   no dangling concept/vocabulary/exercise references, no out-of-range answer
   indexes (semantic).
3. **Content IDs are human-readable slugs** (`greeting-people`), not UUIDs.
   UUIDs are reserved for learner-generated data, which can be created
   offline on many devices; content is authored centrally so collisions
   aren't a risk, and slugs keep JSON reviewable.
4. **Concepts and vocabulary are course-level registries** referenced by ID
   from lessons, because mastery is tracked per concept across lessons.
   Exercises are embedded in their lesson, because they aren't shared.
5. **Localized text requires English and treats Vietnamese as optional**, so
   translation can proceed incrementally; clients must fall back to English.
6. Deterministic grading only where it's honest: `TRANSLATE_TO_KOREAN` has
   accepted answers; translation *from* Korean is open-ended and modeled as
   `FREE_RESPONSE` instead of pretending one English rendering is "correct".

## Consequences

- The backend (Java) cannot consume Zod directly. The published-content JSON
  it stores/serves must conform to this schema; contract tests will validate
  API fixtures against it, and a JSON Schema export can be generated later if
  needed.
- The Java backend and admin dashboard must re-implement nothing: admin
  imports the package directly; the backend treats published content as an
  opaque validated document.
- Culture rewards, conversation missions, and dialogue schemas are not yet
  modeled; they will be added when those features are built (versions of this
  package, not speculative fields now).
- Schema changes after the first published content version will require an
  explicit versioning/migration story (content `version` field exists for
  this).
