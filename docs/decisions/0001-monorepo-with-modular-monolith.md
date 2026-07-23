# ADR 0001: Monorepo with a modular monolith backend

**Status:** Accepted
**Date:** 2026-07-23

## Context

Vernora consists of several deliverables built by a single developer: a React Native
mobile app, a Spring Boot API, a Next.js admin dashboard, shared schemas/contracts,
and (later) a native C++ speech module. We need to decide how to organize the code
and how to structure the backend.

## Decision

1. **Single repository (monorepo)** containing `apps/`, `services/`, `packages/`,
   `infrastructure/`, and `docs/`, without a monorepo build tool (no Nx, no Bazel).
2. **The backend is a modular monolith**: one Spring Boot application, internally
   divided into modules (`catalog`, `learning`, `progress`, `sync`, ...), deployed
   as a single container.

## Rationale

- One developer, tightly coupled deliverables: cross-cutting changes (e.g. a new
  field in the content schema touching backend, mobile, and admin) become a single
  atomic commit instead of three coordinated pull requests.
- Shared types in `packages/` (content schema, API contract) can be referenced
  directly instead of being published as versioned packages.
- A modular monolith gives clear internal boundaries (each module has its own
  `api/application/domain/infrastructure` layers) without the operational cost of
  microservices: one deployment, one database, one log stream — all of which must
  fit within free hosting tiers.
- Nx/Bazel add configuration and learning overhead that a project of this size does
  not need. Plain folders plus per-project tooling (Gradle, npm) is sufficient.

## Consequences

- CI must be configured to run each project's checks (mobile, backend, admin) from
  subdirectories, ideally filtered by changed paths.
- Module boundaries in the backend are enforced by convention and review, not by
  the compiler. If a future need arises, a module can be extracted into a service
  because its boundaries were kept clean.
- If the team grows or projects diverge significantly, this decision can be
  revisited (repo split or a monorepo tool).
