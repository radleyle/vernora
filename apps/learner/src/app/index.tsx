import { useQuery } from "@tanstack/react-query";
import { Link, useRouter } from "expo-router";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { apiGet, type CourseSummary, type Me } from "../lib/api";
import { getSupabase } from "../lib/supabase";
import { useSession } from "../providers/session-provider";

export default function HomeScreen() {
  const { session } = useSession();
  const router = useRouter();

  const courses = useQuery({
    queryKey: ["courses"],
    queryFn: () => apiGet<CourseSummary[]>("/v1/courses"),
  });

  // Round-trips the Supabase token through our own backend: /v1/me only
  // answers when Spring Security has verified the JWT signature.
  const me = useQuery({
    queryKey: ["me", session?.access_token],
    queryFn: () => apiGet<Me>("/v1/me", session?.access_token),
    enabled: session !== null,
  });

  return (
    <View style={styles.container}>
      <View style={styles.authBar}>
        {session === null ? (
          <Link href="/sign-in" style={styles.link}>
            Sign in to track your progress
          </Link>
        ) : (
          <>
            <Text style={styles.authText}>
              {me.isPending
                ? "Verifying with backend..."
                : me.isError
                  ? "Backend rejected the token"
                  : `Signed in as ${me.data.email ?? me.data.userId}`}
            </Text>
            <Pressable onPress={() => getSupabase().auth.signOut()}>
              <Text style={styles.link}>Sign out</Text>
            </Pressable>
          </>
        )}
      </View>

      <Text style={styles.heading}>Courses</Text>
      {courses.isPending && <Text style={styles.muted}>Loading courses…</Text>}
      {courses.isError && (
        <Text style={styles.error}>
          Could not reach the API. Is the backend running on port 8080?
        </Text>
      )}
      <FlatList
        data={courses.data ?? []}
        keyExtractor={(course) => course.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.courseCard}
            onPress={() => router.push(`/course/${item.id}`)}
          >
            <Text style={styles.courseTitle}>{item.title.en}</Text>
            <Text style={styles.muted}>
              {item.language.toUpperCase()} · version {item.version} · tap to start
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f7f7fb" },
  authBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  authText: { fontSize: 14, color: "#333" },
  link: { color: "#4f46e5", fontWeight: "600" },
  heading: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  courseCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  courseTitle: { fontSize: 17, fontWeight: "600", marginBottom: 4 },
  muted: { color: "#6b7280", fontSize: 13 },
  error: { color: "#b91c1c" },
});
