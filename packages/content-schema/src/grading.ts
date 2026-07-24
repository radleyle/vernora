/**
 * Deterministic grading for exercise answers.
 *
 * Lives next to the content schema so every consumer (learner app now, the
 * backend's re-verification and the admin preview later) grades identically.
 * Keep this logic pure: no I/O, no framework imports.
 */

/**
 * Normalizes Korean learner input before comparison:
 * - trims and collapses whitespace
 * - strips common punctuation (a learner typing "감사합니다!" is right)
 * - normalizes Unicode to NFC, because Hangul can be encoded either as
 *   composed syllables (가) or as separate jamo (ㄱ+ㅏ) — visually identical,
 *   but different code points. Some keyboards/IMEs produce the decomposed
 *   form, which would fail a naive string comparison.
 */
export function normalizeAnswer(text: string): string {
  return text
    .normalize("NFC")
    .replace(/[.,!?~‽…'"“”‘’()\[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** True when the learner's answer matches any accepted answer. */
export function isAcceptedAnswer(answer: string, accepted: string[]): boolean {
  const normalized = normalizeAnswer(answer);
  return accepted.some((candidate) => normalizeAnswer(candidate) === normalized);
}

/** True when tokens were arranged in the stored (correct) order. */
export function isCorrectTokenOrder(
  arranged: string[],
  correct: string[],
): boolean {
  return (
    arranged.length === correct.length &&
    arranged.every((token, index) => token === correct[index])
  );
}
