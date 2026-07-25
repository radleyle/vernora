import { Link, Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useCourse } from "../../../features/lessons/use-course";
import {
  isLessonComplete,
  useCourseProgress,
} from "../../../features/lessons/use-progress";

export default function CourseOutlineScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const course = useCourse(courseId);
  // Only fetched when signed in; guests simply never see checkmarks.
  const progress = useCourseProgress(courseId);

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: course.data?.title.en ?? "Course" }} />
      {course.isPending && <Text style={styles.muted}>Loading course…</Text>}
      {course.isError && (
        <Text style={styles.error}>Could not load this course.</Text>
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
});
