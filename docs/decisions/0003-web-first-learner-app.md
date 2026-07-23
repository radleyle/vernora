# ADR 0003: Ship the learner app as a web app first

**Status:** Accepted
**Date:** 2026-07-23

## Context

The specification defines the primary client as a cross-platform mobile app
(React Native/Expo) and treats offline-first SQLite sync as a core feature.
However, mobile distribution has real friction for an MVP: app-store fees
($25 Google / $99 per year Apple), review delays, and build overhead. We want
beta users on a URL as fast as possible, at zero infrastructure cost.

## Decision

1. Build the learner app with **Expo / React Native, targeting web first**
   (React Native Web via Expo Router). The same codebase later builds to iOS
   and Android — the spec's chosen mobile stack is preserved, only the ship
   order changes.
2. The web phase is **online-first**. Offline SQLite storage, the outbox, and
   two-way sync are deferred to the mobile phase.
3. To keep the sync door open, the data model still follows the spec's rules:
   exercise attempts are append-only, identified by client-generated UUIDs,
   and the server enforces uniqueness on (user, client event id). Adding the
   outbox later is then additive, not a rewrite.
4. Web substitutions for device capabilities: browser Web Speech API for
   text-to-speech (device TTS) and speech recording via MediaRecorder.
   On-device ML Kit translation is mobile-only; Quick Translate on web will
   use curated translations plus the AI path with quotas.

## Consequences

- Beta users can be recruited with a link; no app-store spend until the
  product proves itself.
- The offline-sync engineering showcase moves later in the roadmap; the
  portfolio story until then is the content pipeline, backend, and web app.
- Some web-only work (responsive layout, browser audio quirks) is not reused
  by mobile, but screens, navigation, state, and API code are.
- Admin dashboard (Next.js) and backend (Spring Boot + PostgreSQL) are
  unaffected.
