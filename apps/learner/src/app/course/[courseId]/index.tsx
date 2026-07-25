import { Link, Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useCourse } from "../../../features/lessons/use-course";
import {
  isLessonComplete,
  useCourseMastery,
  useCourseProgress,
} from "../../../features/lessons/use-progress";

export default function CourseOutlineScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const course = useCourse(courseId);
  // Only fetched when signed in; guests simply never see checkmarks.
  const progress = useCourseProgress(courseId);
  const mastery = useCourseMastery(courseId);

  // Join mastery rows (weakest first) to concept titles from the content.
  const masteryRows =
    mastery.data?.concepts.flatMap((row) => {
      const concept = course.data?.concepts.find(
        (candidate) => candidate.id === row.conceptId,
      );
      return concept ? [{ ...row, title: concept.name.en }] : [];
    }) ?? [];

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: course.data?.title.en ?? "Course" }} />
      {course.isPending && <Text style={styles.muted}>Loading course…</Text>}
      {course.isError && (
        <Text style={styles.error}>Could not load this course.</Text>
      )}
      {masteryRows.length > 0 && (
        <View style={styles.masteryCard}>
          <Text style={styles.masteryHeading}>Your concept mastery</Text>
          {masteryRows.map((row) => (
            <View key={row.conceptId} style={styles.masteryRow}>
              <View style={styles.masteryLabelRow}>
                <Text style={styles.masteryTitle}>{row.title}</Text>
                <Text style={styles.masteryScore}>{row.masteryScore}</Text>
              </View>
              <View style={styles.masteryTrack}>
                <View
                  style={[
                    styles.masteryFill,
                    { width: `${row.masteryScore}%` },
                    row.masteryScore < 50 && styles.masteryFillWeak,
                  ]}
                />
              </View>
            </View>
          ))}
          <Text style={styles.masteryHint}>
            Producing Korean counts double vs recognizing it. Low scores mean
            few attempts or recent mistakes.
          </Text>
        </View>
      )}
      {course.data?.levels.map((level) => (
        <View key={level.id} style={styles.level}>
          <Text style={styles.levelCode}>{level.code}</Text>
          {level.units.map((unit) => (
            <View key={unit.id}>
              <Text style={styles.unitTitle}>{unit.title.en}</Text>
              {unit.scenarios.map((scenario) => (
                <View key={scenario.id} style={styles.scenario}>
                  <Text style={styles.scenarioTitle}>{scenario.title.en}</Text>
                  <Text style={styles.muted}>{scenario.objective.en}</Text>
                  {scenario.lessons.map((lesson) => {
                    const complete = isLessonComplete(
                      progress.data,
                      lesson.id,
                      lesson.exercises.map((exercise) => exercise.id),
                    );
                    return (
                      <Link
                        key={lesson.id}
                        href={`/course/${courseId}/lesson/${lesson.id}`}
                        style={styles.lessonLink}
                      >
                        <View style={styles.lessonCard}>
                          <Text style={styles.lessonTitle}>
                            {complete ? "✅ " : ""}
                            {lesson.title.en}
                          </Text>
                          <Text style={styles.muted}>{lesson.objective.en}</Text>
                        </View>
                      </Link>
                    );
                  })}
                </View>
              ))}
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f7f7fb" },
  level: { marginBottom: 24 },
  levelCode: {
    fontSize: 13,
    fontWeight: "800",
    color: "#4f46e5",
    marginBottom: 8,
  },
  unitTitle: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  scenario: { marginBottom: 16 },
  scenarioTitle: { fontSize: 17, fontWeight: "600", marginBottom: 2 },
  lessonLink: { marginTop: 10 },
  lessonCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    width: "100%",
  },
  lessonTitle: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  muted: { color: "#6b7280", fontSize: 13 },
  error: { color: "#b91c1c" },
  masteryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  masteryHeading: { fontSize: 17, fontWeight: "700", marginBottom: 12 },
  masteryRow: { marginBottom: 10 },
  masteryLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  masteryTitle: { fontSize: 14, fontWeight: "500" },
  masteryScore: { fontSize: 14, fontWeight: "700", color: "#4f46e5" },
  masteryTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
  },
  masteryFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4f46e5",
  },
  masteryFillWeak: { backgroundColor: "#f59e0b" },
  masteryHint: { color: "#6b7280", fontSize: 12, marginTop: 6 },
});
