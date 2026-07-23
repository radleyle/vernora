# Vernora

An offline-first language-learning platform that prepares learners for real conversations.
The first course teaches **Korean** to English- and Vietnamese-speaking learners (A0 → practical A1, plus selected A2 travel/social scenarios).

> After completing a level, the learner should be able to perform the real-world scenarios associated with that level.

## What makes it different

- Scenario-based lessons (order food, ask directions, check into a hotel) instead of isolated drills
- Production-heavy exercises: learners speak and write from lesson one
- Works fully offline after content is downloaded; progress syncs safely later
- Natural speech: politeness levels, slang, texting conventions, and cultural context
- Personal error memory: the app remembers *your* recurring mistakes and reviews them
- Free core curriculum; AI is a supporting feature with deterministic fallbacks, never a dependency

## Repository structure

```text
vernora/
├── apps/            # User-facing applications
│   ├── mobile/      #   React Native (Expo) learner app        [planned]
│   └── admin/       #   Next.js content administration          [planned]
├── services/        # Backend services
│   └── api/         #   Spring Boot modular monolith            [planned]
├── packages/        # Shared code (API contract, content schema, design tokens)
├── infrastructure/  # Docker Compose, deployment scripts
└── docs/
    ├── architecture/  # System diagrams and design documents
    └── decisions/     # Architecture Decision Records (ADRs)
```

The full product specification lives in [`vernora-description.md`](./vernora-description.md).

## Technology stack

| Area | Technology |
|---|---|
| Mobile | TypeScript, React Native (Expo), SQLite, TanStack Query |
| Backend | Java 21, Spring Boot, PostgreSQL, Flyway |
| Admin | Next.js, TypeScript, Tailwind CSS |
| Platform | Supabase (Postgres/Auth/Storage), Docker, GitHub Actions |
| Speech (later) | C++20, whisper.cpp |

## Status

Pre-development. Currently building the product foundation (Phase 1 of the [roadmap](./vernora-description.md#30-development-roadmap)).
