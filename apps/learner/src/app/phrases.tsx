import { Link, Stack } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { Card } from "../components/ui";
import { useSavedPhrases } from "../features/phrases/use-saved-phrases";
import { speakKorean } from "../lib/tts";
import { useSession } from "../providers/session-provider";

export default function PhrasesScreen() {
  const { session } = useSession();
  const phrases = useSavedPhrases();

  if (!session) {
    return (
      <ScrollView style={styles.container}>
        <Stack.Screen options={{ title: "Saved phrases" }} />
        <Text style={styles.body}>Sign in to keep a notebook of words.</Text>
        <Link href="/sign-in" style={styles.link}>
          Sign in
        </Link>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: "Saved phrases" }} />
      {phrases.isPending && <Text style={styles.muted}>Loading…</Text>}
      {phrases.isError && (
        <Text style={styles.error}>
          Could not load saved phrases.
          {"\n"}
          {phrases.error instanceof Error
            ? phrases.error.message
            : "Unknown error"}
          {"\n"}
          Restart the API after adding the phrases module: stop whatever is
          on port 8080, then from services/api run ./gradlew bootRun.
        </Text>
      )}
      {phrases.data?.phrases.length === 0 && (
        <Text style={styles.body}>
          Nothing saved yet. Open a lesson, tap Save on a word.
        </Text>
      )}
      {phrases.data?.phrases.map((phrase) => (
        <Pressable
          key={phrase.phraseId}
          onPress={() => speakKorean(phrase.korean)}
        >
          <Card>
            <Text style={styles.korean}>🔊 {phrase.korean}</Text>
            {phrase.romanization ? (
              <Text style={styles.muted}>{phrase.romanization}</Text>
            ) : null}
            <Text style={styles.meaning}>{phrase.meaningEn}</Text>
          </Card>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f7f7fb" },
  body: { fontSize: 16, lineHeight: 24, marginBottom: 12 },
  link: { color: "#4f46e5", fontWeight: "600" },
  muted: { color: "#6b7280", fontSize: 13, marginBottom: 4 },
  error: { color: "#b91c1c" },
  korean: { fontSize: 18, fontWeight: "700", marginBottom: 2 },
  meaning: { fontSize: 15, color: "#374151" },
});