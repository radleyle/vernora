import { z } from "zod";
import {
  ContentId,
  Formality,
  LanguageCode,
  LevelCode,
  LocalizedText,
} from "./common";
import { Exercise } from "./exercises";

/**
 * A reusable unit of knowledge (a grammar point, politeness rule, or usage
 * pattern). Concepts are first-class because learner mastery is tracked per
 * concept across lessons — not per lesson.
 */
export const Concept = z.object({
  id: ContentId,
  name: LocalizedText,
  explanation: LocalizedText,
  examples: z
    .array(z.object({ korean: z.string().min(1), meaning: LocalizedText }))
    .default([]),
});

export const VocabularyItem = z.object({
  id: ContentId,
  korean: z.string().min(1),
  romanization: z.string().min(1).optional(),
  meaning: LocalizedText,
  formality: Formality.optional(),
  notes: LocalizedText.optional(),
});

/**
 * A lesson is an ordered sequence of steps. Steps reference concepts and
 * vocabulary from the course-level registries (so they can be shared across
 * lessons), and exercises from the lesson's own `exercises` array.
 */
export const LessonStep = z.discriminatedUnion("type", [
  /** Sets the real-world scene: "You walk into a café in Seoul..." */
  z.object({ type: z.literal("SITUATION"), text: LocalizedText }),
  z.object({ type: z.literal("CONCEPT"), conceptId: ContentId }),
  z.object({
    type: z.literal("VOCABULARY"),
    vocabularyIds: z.array(ContentId).min(1),
  }),
  z.object({ type: z.literal("EXERCISE"), exerciseId: ContentId }),
]);

/**
 * A small cultural payoff shown after the lesson is completed (spec 9.7).
 * Embedded in the lesson rather than fetched from a separate endpoint:
 * it ships with the course document, works offline, and needs no AI.
 */
export const CultureReward = z.object({
  kind: z.enum(["OBSERVATION", "EXPRESSION", "FACT", "MISUNDERSTANDING"]),
  title: LocalizedText,
  body: LocalizedText,
});

export const Lesson = z.object({
  id: ContentId,
  title: LocalizedText,
  /** What the learner can do afterwards: "greet someone politely". */
  objective: LocalizedText,
  steps: z.array(LessonStep).min(1),
  exercises: z.array(Exercise),
  /** Optional so pre-reward course versions keep validating. */
  cultureReward: CultureReward.optional(),
});

export const Scenario = z.object({
  id: ContentId,
  title: LocalizedText,
  location: LocalizedText.optional(),
  objective: LocalizedText,
  lessons: z.array(Lesson).min(1),
});

export const Unit = z.object({
  id: ContentId,
  title: LocalizedText,
  scenarios: z.array(Scenario).min(1),
});

export const Level = z.object({
  id: ContentId,
  code: LevelCode,
  units: z.array(Unit).min(1),
});

export const Course = z.object({
  id: ContentId,
  /**
   * Published content is immutable: corrections produce a new version with a
   * higher number. Devices report which version they hold, which is how sync
   * detects stale content.
   */
  version: z.number().int().positive(),
  language: LanguageCode,
  explanationLanguages: z.array(LanguageCode).min(1),
  title: LocalizedText,
  /** Course-wide registries, referenced by ID from lesson steps. */
  concepts: z.array(Concept),
  vocabulary: z.array(VocabularyItem),
  levels: z.array(Level).min(1),
});

export type Concept = z.infer<typeof Concept>;
export type VocabularyItem = z.infer<typeof VocabularyItem>;
export type LessonStep = z.infer<typeof LessonStep>;
export type Lesson = z.infer<typeof Lesson>;
export type Scenario = z.infer<typeof Scenario>;
export type Unit = z.infer<typeof Unit>;
export type Level = z.infer<typeof Level>;
export type Course = z.infer<typeof Course>;
export type CultureReward = z.infer<typeof CultureReward>;
