import type { Course, Exercise } from "@vernora/content-schema";
import { Link, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Card, PrimaryButton } from "../components/ui";
import { ExerciseHost } from "../features/lessons/exercise-host";
import { useCourse } from "../features/lessons/use-course";
import { useSubmitAttempt } from "../features/lessons/use-progress";
import {
  useReviewQueue,
  type ReviewQueueItem,
} from "../features/lessons/use-review";
import { useSession } from "../providers/session-provider";

function findExercise(
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

export default function ReviewScreen() {
  const { session } = useSession();
  const queue = useReviewQueue();
  const submitAttempt = useSubmitAttempt();

  // Snapshot the queue when it first arrives. Each answer we submit
  // invalidates the review-queue query; without a snapshot the refetch
  // would reshuffle the deck underneath the learner mid-session.
  const [items, setItems] = useState<ReviewQueueItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [stepDone, setStepDone] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    if (queue.data && items === null) {
      setItems(queue.data.items);
    }
  }, [queue.data, items]);

  const current = items?.[index];
  const course = useCourse(current?.courseId);

  if (!session) {
    return (
      <ScrollView style={styles.container}>
        <Stack.Screen options={{ title: "Review" }} />
        <Card>
          <Text style={styles.body}>
            Reviews are built from your own attempt history.
          </Text>
          <Link href="/sign-in" style={styles.link}>
            Sign in to start reviewing
          </Link>
        </Card>
      </ScrollView>
    );
  }

  if (queue.isPending || items === null) {
    return <Text style={styles.status}>Checking what is due…</Text>;
  }
  if (queue.isError) {
    return <Text style={styles.statusError}>Could not load your reviews.</Text>;
  }

  if (items.length === 0) {
    return (
      <ScrollView style={styles.container}>
        <Stack.Screen options={{ title: "Review" }} />
        <Card>
          <Text style={styles.doneTitle}>Nothing due 🎉</Text>
          <Text style={styles.body}>
            Every exercise you have practiced is scheduled for later. Come
            back tomorrow, or learn something new.
          </Text>
          <Link href="/" style={styles.link}>
            Back home
          </Link>
        </Card>
      </ScrollView>
    );
  }

  const finished = index >= items.length;
  const exercise =
    current && course.data
      ? findExercise(course.data, current.lessonId, current.exerciseId)
      : undefined;

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: "Review" }} />
      {!finished && (
        <>
          <Text style={styles.progressLabel}>
            {index + 1} of {items.length} due
            {current && current.streak > 0
              ? ` · streak ${current.streak}`
              : " · missed last time"}
          </Text>
          {course.isPending && (
            <Text style={styles.status}>Loading exercise…</Text>
          )}
          {course.isError && (
            <Text style={styles.statusError}>
              Could not load this exercise's course.
            </Text>
          )}
          {exercise && current && (
            <ExerciseHost
              // Remount per item so exercise-local state resets.
              key={`${current.courseId}/${current.exerciseId}/${index}`}
              exercise={exercise}
              onComplete={(correct) => {
                setStepDone(true);
                if (correct) setCorrectCount((count) => count + 1);
                // Same write path as lessons: an idempotent attempt, which
                // is also what reschedules this item for next time.
                submitAttempt.mutate({
                  attemptId: crypto.randomUUID(),
                  exerciseId: current.exerciseId,
                  exerciseType: exercise.type,
                  courseId: current.courseId,
                  lessonId: current.lessonId,
                  correct,
                });
              }}
            />
          )}
          {course.data && !exercise && (
            <Card>
              {/* Content can change between versions; skip gracefully. */}
              <Text style={styles.body}>
                This exercise is no longer in the course.
              </Text>
              <PrimaryButton
                label="Skip"
                onPress={() => setIndex((i) => i + 1)}
              />
            </Card>
          )}
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
          <Text style={styles.doneTitle}>Review complete! 🧠</Text>
          <Text style={styles.body}>
            {correctCount} of {items.length} correct. Items you got right
            moved further out; anything you missed comes back in 10 minutes.
          </Text>
          <Link href="/" style={styles.link}>
            Back home
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
  doneTitle: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  body: { fontSize: 15, marginBottom: 10, color: "#111827" },
  link: { color: "#4f46e5", fontWeight: "600", marginTop: 6 },
});
