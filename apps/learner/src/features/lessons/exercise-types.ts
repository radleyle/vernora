import type { Exercise } from "@vernora/content-schema";

/** Narrows the Exercise union to one variant, e.g. ExerciseOf<"SPEAK">. */
export type ExerciseOf<T extends Exercise["type"]> = Extract<
  Exercise,
  { type: T }
>;

/** Every exercise renderer implements this contract. */
export type ExerciseProps<T extends Exercise["type"]> = {
  exercise: ExerciseOf<T>;
  /** Called exactly once, when the learner has finished the exercise. */
  onComplete: (correct: boolean) => void;
};
