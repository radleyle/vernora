import { z } from "zod";

/**
 * Content IDs are human-readable slugs, e.g. "ko-a0-greetings".
 *
 * Learner-generated data (exercise attempts, saved phrases) will use UUIDs
 * because it can be created offline on many devices at once. Content is
 * authored centrally, so collisions aren't a risk, and readable IDs make
 * JSON files reviewable and debugging painless.
 */
export const ContentId = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "must be a lowercase kebab-case slug");

export const LanguageCode = z.enum(["ko", "en", "vi"]);

/**
 * Text shown to the learner in their explanation language.
 * English is required; Vietnamese can be added incrementally, so the app
 * must always be able to fall back to English.
 */
export const LocalizedText = z.object({
  en: z.string().min(1),
  vi: z.string().min(1).optional(),
});

export const Formality = z.enum(["FORMAL", "POLITE", "CASUAL"]);

export const LevelCode = z.enum(["A0", "A1", "A2", "B1", "B2"]);

export type ContentId = z.infer<typeof ContentId>;
export type LanguageCode = z.infer<typeof LanguageCode>;
export type LocalizedText = z.infer<typeof LocalizedText>;
export type Formality = z.infer<typeof Formality>;
export type LevelCode = z.infer<typeof LevelCode>;
