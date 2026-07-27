import type { Exercise } from "@vernora/content-schema";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Card, PrimaryButton } from "../components/ui";
import { findExercisesForConcept } from "../features/lessons/course-lookup";
import { ExerciseHost } from "../features/lessons/exercise-host";
import { shuffle } from "../features/lessons/shuffle";
import { useCourse } from "../features/lessons/use-course";
import { useSubmitAttempt } from "../features/lessons/use-progress";
import { useSession } from "../providers/session-provider";

/** How many exercises make up one focused practice session. */
const SESSION_SIZE = 5;

/**
 * A focused practice session for one weak concept, reached from the
 * "needs review" card on the course outline. Unlike the lesson player
 * (fixed order, one lesson) or the review screen (scheduler-driven, mixed
 * concepts), this pulls every exercise tagged with a single concept from
 * anywhere in the course — deliberate repetition of exactly what's shaky.
 */
export default function PracticeScreen() {
  const { session } = useSession();
  const { courseId, conceptId } = useLocalSearchParams<{
    courseId: string;
    conceptId: string;
  }>();
  const course = useCourse(courseId);
  const submitAttempt = useSubmitAttempt();

  // Snapshot the session once the course loads, so re-renders (or the
  // mastery refetch triggered by our own submissions) never reshuffle the
  // deck underneath the learner mid-session.
  const [items, setItems] = useState<Array<{
    lessonId: string;
    exercise: Exercise;
  }> | null>(null);
  const [index, setIndex] = useState(0);
  const [stepDone, setStepDone] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    if (course.data && items === null) {
      const matches = findExercisesForConcept(course.data, conceptId);
      setItems(shuffle(matches).slice(0, SESSION_SIZE));
    }
  }, [course.data, conceptId, items]);

  const concept = course.data?.concepts.find((c) => c.id === conceptId);
  const conceptTitle = concept?.name.en ?? conceptId;

  if (!session) {
    return (
      <ScrollView style={styles.container}>
        <Stack.Screen options={{ title: "Practice" }} />
        <Card>
          <Text style={styles.body}>
            Practice sessions are built from your own attempt history.
          </Text>
          <Link href="/sign-in" style={styles.link}>
            Sign in to practice
          </Link>
        </Card>
      </ScrollView>
    );
  }

  if (course.isPending || items === null) {
    return <Text style={styles.status}>Finding exercises to practice…</Text>;
  }
  if (course.isError) {
    return <Text style={styles.statusError}>Could not load this course.</Text>;
  }

  if (items.length === 0) {
    return (
      <ScrollView style={styles.container}>
        <Stack.Screen options={{ title: "Practice" }} />
        <Card>
          <Text style={styles.doneTitle}>Nothing to practice here</Text>
          <Text style={styles.body}>
            No exercises in this course are tagged with "{conceptTitle}" yet.
          </Text>
          <Link href={`/course/${courseId}`} style={styles.link}>
            Back to course
          </Link>
        </Card>
      </ScrollView>
    );
  }

  const finished = index >= items.length;
  const current = items[index];

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: `Practice: ${conceptTitle}` }} />
      {!finished && current && (
        <>
          <Text style={styles.progressLabel}>
            Practicing "{conceptTitle}" · {index + 1} of {items.length}
          </Text>
          {concept && (
            <Card>
              <Text style={styles.explanation}>{concept.explanation.en}</Text>
            </Card>
          )}
          <ExerciseHost
            // Remount per item so exercise-local state resets.
            key={`${current.exercise.id}/${index}`}
            exercise={current.exercise}
            onComplete={(correct) => {
              setStepDone(true);
              if (correct) setCorrectCount((count) => count + 1);
              submitAttempt.mutate({
                attemptId: crypto.randomUUID(),
                exerciseId: current.exercise.id,
                exerciseType: current.exercise.type,
                conceptIds: current.exercise.conceptIds,
                courseId,
                lessonId: current.lessonId,
                correct,
              });
            }}
          />
          {stepDone && (
            <PrimaryButton
              label={index === items.length - 1 ? "Finish" : "Next"}
              onPress={() => {
                setIndex((i) => i + 1);
                setStepDone(false);
              }}
            />
          )}
        </>
      )}
      {finished && (
        <Card>
          <Text style={styles.doneTitle}>Practice complete! 💪</Text>
          <Text style={styles.body}>
            {correctCount} of {items.length} correct on "{conceptTitle}".
          </Text>
          <Link href={`/course/${courseId}`} style={styles.link}>
            Back to course
          </Link>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f7f7fb" },
  status: { padding: 24, color: "#6b7280" },
  statusError: { padding: 24, color: "#b91c1c" },
  progressLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 12,
  },
  explanation: { fontSize: 14, color: "#374151" },
  doneTitle: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  body: { fontSize: 15, marginBottom: 10, color: "#111827" },
  link: { color: "#4f46e5", fontWeight: "600", marginTop: 6 },
});
