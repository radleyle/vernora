import { z } from "zod";
import { ContentId, Formality, LocalizedText } from "./common";

/**
 * Fields shared by every exercise type.
 *
 * `conceptIds` is the link between exercises and the mastery system: an
 * attempt at this exercise is evidence for or against the learner knowing
 * these concepts. Review scheduling keys on concepts, not on exercises.
 */
const ExerciseBase = z.object({
  id: ContentId,
  conceptIds: z.array(ContentId).min(1),
  instruction: LocalizedText,
  hint: LocalizedText.optional(),
});

/** An option can show Korean text, a translated meaning, or both. */
const McqOption = z
  .object({
    korean: z.string().min(1).optional(),
    meaning: LocalizedText.optional(),
  })
  .refine((o) => o.korean !== undefined || o.meaning !== undefined, {
    message: "option needs korean text or a meaning (or both)",
  });

/** Learner hears Korean audio and selects the matching option. */
export const ListenAndSelect = ExerciseBase.extend({
  type: z.literal("LISTEN_AND_SELECT"),
  /** Korean text synthesized by device TTS, or matched to a recorded asset later. */
  audioText: z.string().min(1),
  options: z.array(McqOption).min(2),
  correctIndex: z.number().int().nonnegative(),
});

/** Learner matches Korean expressions to their meanings. */
export const MatchPairs = ExerciseBase.extend({
  type: z.literal("MATCH_PAIRS"),
  pairs: z
    .array(z.object({ korean: z.string().min(1), meaning: LocalizedText }))
    .min(2),
});

/** Learner arranges shuffled tokens into a correct sentence. */
export const ArrangeTokens = ExerciseBase.extend({
  type: z.literal("ARRANGE_TOKENS"),
  /** Stored in correct order; the client shuffles them for display. */
  tokens: z.array(z.string().min(1)).min(2),
  /** Extra wrong tokens mixed in to raise difficulty. */
  distractors: z.array(z.string().min(1)).default([]),
  translation: LocalizedText,
});

/** Learner types the missing word in a Korean sentence. */
export const FillBlank = ExerciseBase.extend({
  type: z.literal("FILL_BLANK"),
  /** Sentence containing exactly one "___" placeholder. */
  sentence: z.string().includes("___"),
  acceptedAnswers: z.array(z.string().min(1)).min(1),
  translation: LocalizedText,
});

/**
 * Learner translates a prompt into Korean.
 * Deterministic: graded locally against `acceptedAnswers` after
 * normalization (whitespace, punctuation). Translation *from* Korean is an
 * open-ended task and is covered by FREE_RESPONSE instead.
 */
export const TranslateToKorean = ExerciseBase.extend({
  type: z.literal("TRANSLATE_TO_KOREAN"),
  prompt: LocalizedText,
  acceptedAnswers: z.array(z.string().min(1)).min(1),
});

/**
 * Open-ended production. Not graded deterministically; the learner compares
 * against sample answers, and AI feedback can be layered on later.
 */
export const FreeResponse = ExerciseBase.extend({
  type: z.literal("FREE_RESPONSE"),
  prompt: LocalizedText,
  /** Optional Korean line the learner is responding to. */
  koreanContext: z.string().min(1).optional(),
  sampleAnswers: z.array(z.string().min(1)).default([]),
});

/** Learner records themselves saying the target Korean text. */
export const Speak = ExerciseBase.extend({
  type: z.literal("SPEAK"),
  targetText: z.string().min(1),
  translation: LocalizedText,
});

/** Learner picks the expression with appropriate politeness for a situation. */
export const PolitenessChoice = ExerciseBase.extend({
  type: z.literal("POLITENESS_CHOICE"),
  situation: LocalizedText,
  options: z
    .array(z.object({ korean: z.string().min(1), formality: Formality }))
    .min(2),
  correctIndex: z.number().int().nonnegative(),
  explanation: LocalizedText,
});

export const Exercise = z.discriminatedUnion("type", [
  ListenAndSelect,
  MatchPairs,
  ArrangeTokens,
  FillBlank,
  TranslateToKorean,
  FreeResponse,
  Speak,
  PolitenessChoice,
]);

export type Exercise = z.infer<typeof Exercise>;
export type ExerciseType = Exercise["type"];
