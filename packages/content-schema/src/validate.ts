import type { Course, Lesson } from "./curriculum";

/**
 * Semantic validation, applied after Zod's structural validation.
 *
 * Zod can prove a document has the right *shape*, but not that it makes
 * *sense*: a step can reference a concept that doesn't exist, or an MCQ's
 * correctIndex can point past the end of its options. These cross-reference
 * rules live here. The admin dashboard will run both layers before allowing
 * a publish.
 */
export function validateCourseReferences(course: Course): string[] {
  const errors: string[] = [];
  const conceptIds = new Set(course.concepts.map((c) => c.id));
  const vocabularyIds = new Set(course.vocabulary.map((v) => v.id));

  for (const level of course.levels) {
    for (const unit of level.units) {
      for (const scenario of unit.scenarios) {
        for (const lesson of scenario.lessons) {
          validateLesson(lesson, conceptIds, vocabularyIds, errors);
        }
      }
    }
  }
  return errors;
}

function validateLesson(
  lesson: Lesson,
  conceptIds: Set<string>,
  vocabularyIds: Set<string>,
  errors: string[],
): void {
  const at = `lesson "${lesson.id}"`;
  const exerciseIds = new Set(lesson.exercises.map((e) => e.id));

  for (const step of lesson.steps) {
    switch (step.type) {
      case "CONCEPT":
        if (!conceptIds.has(step.conceptId)) {
          errors.push(`${at}: step references unknown concept "${step.conceptId}"`);
        }
        break;
      case "VOCABULARY":
        for (const id of step.vocabularyIds) {
          if (!vocabularyIds.has(id)) {
            errors.push(`${at}: step references unknown vocabulary "${id}"`);
          }
        }
        break;
      case "EXERCISE":
        if (!exerciseIds.has(step.exerciseId)) {
          errors.push(`${at}: step references unknown exercise "${step.exerciseId}"`);
        }
        break;
      case "SITUATION":
        break;
    }
  }

  for (const exercise of lesson.exercises) {
    const exAt = `${at}, exercise "${exercise.id}"`;
    for (const conceptId of exercise.conceptIds) {
      if (!conceptIds.has(conceptId)) {
        errors.push(`${exAt}: references unknown concept "${conceptId}"`);
      }
    }
    if (
      (exercise.type === "LISTEN_AND_SELECT" ||
        exercise.type === "POLITENESS_CHOICE") &&
      exercise.correctIndex >= exercise.options.length
    ) {
      errors.push(
        `${exAt}: correctIndex ${exercise.correctIndex} is out of range ` +
          `(${exercise.options.length} options)`,
      );
    }
  }
}
