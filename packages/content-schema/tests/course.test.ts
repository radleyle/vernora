import { describe, expect, it } from "vitest";
import { Course, validateCourseReferences } from "../src/index";
import sampleCourse from "../samples/korean-course.json";

describe("Course schema (structural validation)", () => {
  it("accepts the sample Korean course", () => {
    const result = Course.safeParse(sampleCourse);
    if (!result.success) {
      // Surface Zod's error tree so a failure is actually debuggable.
      throw new Error(JSON.stringify(result.error.format(), null, 2));
    }
    expect(result.success).toBe(true);
  });

  it("rejects an unknown formality value", () => {
    const broken = structuredClone(sampleCourse);
    (broken.vocabulary[0] as { formality: string }).formality = "SUPER_POLITE";
    expect(Course.safeParse(broken).success).toBe(false);
  });

  it("rejects a fill-blank sentence without a blank", () => {
    const exercise = {
      id: "bad-blank",
      type: "FILL_BLANK",
      conceptIds: ["greeting-people"],
      instruction: { en: "Fill in the blank." },
      sentence: "감사합니다",
      acceptedAnswers: ["감사"],
      translation: { en: "Thank you." },
    };
    const broken = structuredClone(sampleCourse);
    broken.levels[0]!.units[0]!.scenarios[0]!.lessons[0]!.exercises.push(
      exercise as never,
    );
    expect(Course.safeParse(broken).success).toBe(false);
  });
});

describe("validateCourseReferences (semantic validation)", () => {
  const course = Course.parse(sampleCourse);

  it("finds no problems in the sample course", () => {
    expect(validateCourseReferences(course)).toEqual([]);
  });

  it("catches a step pointing at a missing exercise", () => {
    const broken = structuredClone(course);
    broken.levels[0]!.units[0]!.scenarios[0]!.lessons[0]!.steps.push({
      type: "EXERCISE",
      exerciseId: "does-not-exist",
    });
    const errors = validateCourseReferences(broken);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('unknown exercise "does-not-exist"');
  });

  it("catches an out-of-range correctIndex", () => {
    const broken = structuredClone(course);
    const exercise = broken.levels
      .flatMap((level) => level.units)
      .flatMap((unit) => unit.scenarios)
      .flatMap((scenario) => scenario.lessons)
      .flatMap((lesson) => lesson.exercises)
      .find((e) => e.id === "listen-hello");
    if (exercise?.type !== "LISTEN_AND_SELECT") throw new Error("unexpected");
    exercise.correctIndex = 99;
    const errors = validateCourseReferences(broken);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("out of range");
  });

  it("catches an exercise tagged with an unknown concept", () => {
    const broken = structuredClone(course);
    broken.levels[0]!.units[0]!.scenarios[0]!.lessons[0]!
      .exercises[0]!.conceptIds.push("ghost-concept");
    const errors = validateCourseReferences(broken);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('unknown concept "ghost-concept"');
  });

  it("accepts a lesson without a culture reward (older versions)", () => {
    const broken = structuredClone(sampleCourse);
    delete (
      broken.levels[0]!.units[0]!.scenarios[0]!.lessons[0] as {
        cultureReward?: unknown;
      }
    ).cultureReward;
    expect(Course.safeParse(broken).success).toBe(true);
  });
  
  it("rejects a culture reward missing its English title", () => {
    const broken = structuredClone(sampleCourse);
    (broken.levels[0]!.units[0]!.scenarios[0]!.lessons[0] as {
      cultureReward?: unknown;
    }).cultureReward = {
      kind: "FACT",
      title: { vi: "chỉ có tiếng Việt" },
      body: { en: "body text" },
    };
    expect(Course.safeParse(broken).success).toBe(false);
  });
});
