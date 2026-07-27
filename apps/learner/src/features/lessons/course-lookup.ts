import type { Course, Exercise } from "@vernora/content-schema";

/** Finds one exercise by lesson + exercise id, searching the whole course tree. */
export function findExercise(
  course: Course,
  lessonId: string,
  exerciseId: string,
): Exercise | undefined {
  for (const level of course.levels)
    for (const unit of level.units)
      for (const scenario of unit.scenarios)
        for (const lesson of scenario.lessons)
          if (lesson.id === lessonId)
            return lesson.exercises.find((e) => e.id === exerciseId);
  return undefined;
}

/**
 * Every exercise across the whole course tagged with a given concept,
 * regardless of which lesson introduced it. This is what makes a "practice
 * this weak concept" session possible: mastery is tracked per concept, so
 * practice must be able to pull from anywhere the concept appears, not just
 * the lesson the learner happens to be viewing.
 */
export function findExercisesForConcept(
  course: Course,
  conceptId: string,
): Array<{ lessonId: string; exercise: Exercise }> {
  const matches: Array<{ lessonId: string; exercise: Exercise }> = [];
  for (const level of course.levels)
    for (const unit of level.units)
      for (const scenario of unit.scenarios)
        for (const lesson of scenario.lessons)
          for (const exercise of lesson.exercises)
            if (exercise.conceptIds.includes(conceptId)) {
              matches.push({ lessonId: lesson.id, exercise });
            }
  return matches;
}
