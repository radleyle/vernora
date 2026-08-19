import type { Course, Lesson } from "@vernora/content-schema";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Card, PrimaryButton } from "../../../../components/ui";
import { ExerciseHost } from "../../../../features/lessons/exercise-host";
import {
  ConceptCard,
  SituationCard,
  VocabularyCard,
} from "../../../../features/lessons/step-cards";
import { useCourse } from "../../../../features/lessons/use-course";
import { useSubmitAttempt } from "../../../../features/lessons/use-progress";

function findLesson(course: Course, lessonId: string): Lesson | undefined {
  for (const level of course.levels)
    for (const unit of level.units)
      for (const scenario of unit.scenarios)
        for (const lesson of scenario.lessons)
          if (lesson.id === lessonId) return lesson;
  return undefined;
}

export default function LessonPlayerScreen() {
  const { courseId, lessonId } = useLocalSearchParams<{
    courseId: string;
    lessonId: string;
  }>();
  const course = useCourse(courseId);
  const router = useRouter();
  const submitAttempt = useSubmitAttempt();

  const [stepIndex, setStepIndex] = useState(0);
  // Exercise results keyed by exercise id; null = current one not finished.
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [stepDone, setStepDone] = useState(false);

  if (course.isPending) {
    return <Text style={styles.status}>Loading lesson…</Text>;
  }
  if (course.isError || !course.data) {
    return <Text style={styles.statusError}>Could not load this lesson.</Text>;
  }

  const lesson = findLesson(course.data, lessonId);
  if (!lesson) {
    return <Text style={styles.statusError}>Lesson not found.</Text>;
  }

  const finished = stepIndex >= lesson.steps.length;
  const step = lesson.steps[stepIndex];
  const totalExercises = lesson.steps.filter((s) => s.type === "EXERCISE").length;
  const correctCount = Object.values(results).filter(Boolean).length;

  function advance() {
    setStepIndex((index) => index + 1);
    setStepDone(false);
  }

  function renderStep() {
    if (!step) return null;
    switch (step.type) {
      case "SITUATION":
        return <SituationCard text={step.text} />;
      case "CONCEPT": {
        const concept = course.data!.concepts.find(
          (c) => c.id === step.conceptId,
        );
        return concept ? <ConceptCard concept={concept} /> : null;
      }
      case "VOCABULARY": {
        const items = course.data!.vocabulary.filter((item) =>
          step.vocabularyIds.includes(item.id),
        );
        return <VocabularyCard 
          items={items}
          courseId = {courseId}
          lessonId = {lessonId}
        />;
      }
      case "EXERCISE": {
        const exercise = lesson!.exercises.find(
          (e) => e.id === step.exerciseId,
        );
        if (!exercise) return null;
        return (
          <ExerciseHost
            // Remount per step so exercise-local state resets.
            key={exercise.id}
            exercise={exercise}
            onComplete={(correct) => {
              setResults((current) => ({ ...current, [exercise.id]: correct }));
              setStepDone(true);
              // Fire-and-forget: grading already happened locally, so a
              // failed submission never blocks the learner. The UUID minted
              // here is the idempotency key the server dedupes on.
              submitAttempt.mutate({
                attemptId: crypto.randomUUID(),
                exerciseId: exercise.id,
                exerciseType: exercise.type,
                conceptIds: exercise.conceptIds,
                courseId,
                lessonId,
                correct,
              });
            }}
          />
        );
      }
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: lesson.title.en }} />
      {!finished && (
        <>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${(stepIndex / lesson.steps.length) * 100}%` },
              ]}
            />
          </View>
          {renderStep()}
          {(step?.type !== "EXERCISE" || stepDone) && (
            <PrimaryButton
              label={stepIndex === lesson.steps.length - 1 ? "Finish" : "Continue"}
              onPress={advance}
            />
          )}
        </>
      )}
      {finished && (
        <Card>
          <Text style={styles.doneTitle}>Lesson complete! 🎉</Text>
          {lesson.cultureReward ? (
            <View style={styles.reward}>
              <Text style={styles.rewardKind}>
                {lesson.cultureReward.kind.toLowerCase()}
              </Text>
              <Text style={styles.rewardTitle}>
                {lesson.cultureReward.title.en}
              </Text>
              <Text style={styles.rewardBody}>
                {lesson.cultureReward.body.en}
              </Text>
            </View>
          ) : null}
          <Text style={styles.doneBody}>
            You got {correctCount} of {totalExercises} exercises right.
          </Text>
          <Text style={styles.doneBody}>
            Objective: {lesson.objective.en}
          </Text>
          <PrimaryButton
            label="Back to course"
            onPress={() => router.replace(`/course/${courseId}`)}
          />
          <PrimaryButton
            label="Home"
            onPress={() => router.replace("/")}
          />
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f7f7fb" },
  status: { padding: 24, color: "#6b7280" },
  statusError: { padding: 24, color: "#b91c1c" },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e5e7eb",
    marginBottom: 16,
    overflow: "hidden",
  },
  progressFill: { height: 8, backgroundColor: "#4f46e5" },
  doneTitle: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  doneBody: { fontSize: 15, marginBottom: 6 },
  reward: {
    backgroundColor: "#eef2ff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  rewardKind: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4f46e5",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  rewardTitle: { fontSize: 17, fontWeight: "700", marginBottom: 6 },
  rewardBody: { fontSize: 15, lineHeight: 22, color: "#374151" },
});
