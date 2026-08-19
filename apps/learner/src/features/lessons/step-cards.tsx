import type {
  Concept,
  LocalizedText,
  VocabularyItem,
} from "@vernora/content-schema";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "../../components/ui";
import { speakKorean } from "../../lib/tts";
import { useRouter } from "expo-router";
import {
  useSavePhrase,
  useSavedPhrases,
} from "../phrases/use-saved-phrases";
import { useSession } from "../../providers/session-provider";

export function SituationCard({ text }: { text: LocalizedText }) {
  return (
    <Card>
      <Text style={styles.kicker}>Situation</Text>
      <Text style={styles.body}>{text.en}</Text>
    </Card>
  );
}

export function ConceptCard({ concept }: { concept: Concept }) {
  return (
    <Card>
      <Text style={styles.kicker}>Concept</Text>
      <Text style={styles.title}>{concept.name.en}</Text>
      <Text style={styles.body}>{concept.explanation.en}</Text>
      {concept.examples.map((example) => (
        <Pressable
          key={example.korean}
          style={styles.example}
          onPress={() => speakKorean(example.korean)}
        >
          <Text style={styles.exampleKorean}>🔊 {example.korean}</Text>
          <Text style={styles.muted}>{example.meaning.en}</Text>
        </Pressable>
      ))}
    </Card>
  );
}

export function VocabularyCard({
  items,
  courseId,
  lessonId,
}: {
  items: VocabularyItem[];
  courseId?: string;
  lessonId?: string;
}) {
  const { session } = useSession();
  const router = useRouter();
  const saved = useSavedPhrases();
  const savePhrase = useSavePhrase();
  const [justSaved, setJustSaved] = useState<string[]>([]);
  const savedKorean = new Set([
    ...(saved.data?.phrases.map((phrase) => phrase.korean) ?? []),
    ...justSaved,
  ]);

  function onSave(item: VocabularyItem) {
    if (!session) {
      router.push("/sign-in");
      return;
    }
    if (savedKorean.has(item.korean) || savePhrase.isPending) return;
    setJustSaved((current) => [...current, item.korean]);
    savePhrase.mutate({
      phraseId: crypto.randomUUID(),
      korean: item.korean,
      meaningEn: item.meaning.en,
      romanization: item.romanization,
      sourceCourseId: courseId,
      sourceLessonId: lessonId,
    });
  }

  return (
    <Card>
      <Text style={styles.kicker}>New words</Text>
      {items.map((item) => {
        const isSaved = savedKorean.has(item.korean);
        return (
          <View key={item.id} style={styles.vocabRow}>
            <Pressable
              style={styles.vocabSpeak}
              onPress={() => speakKorean(item.korean)}
            >
              <View style={styles.vocabLeft}>
                <Text style={styles.vocabKorean}>🔊 {item.korean}</Text>
                {item.romanization && (
                  <Text style={styles.muted}>{item.romanization}</Text>
                )}
              </View>
              <Text style={styles.vocabMeaning}>{item.meaning.en}</Text>
            </Pressable>
            <Pressable
              onPress={() => onSave(item)}
              style={[styles.saveHit, isSaved && styles.saveHitDone]}
              hitSlop={8}
            >
              <Text style={[styles.save, isSaved && styles.saveDone]}>
                {isSaved ? "Saved" : "Save"}
              </Text>
            </Pressable>
          </View>
        );
      })}
      <Text style={styles.hint}>
        Tap a word to hear it. Save puts it in your notebook.
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  kicker: {
    color: "#4f46e5",
    fontWeight: "700",
    fontSize: 12,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  body: { fontSize: 16, lineHeight: 24 },
  example: {
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  exampleKorean: { fontSize: 16, fontWeight: "600", marginBottom: 2 },
  vocabRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  vocabLeft: { gap: 2 },
  vocabKorean: { fontSize: 17, fontWeight: "600" },
  vocabMeaning: { fontSize: 15, color: "#374151", flexShrink: 1 },
  muted: { color: "#6b7280", fontSize: 13 },
  hint: { color: "#9ca3af", fontSize: 12, marginTop: 10 },
  vocabSpeak: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  saveHit: {
    backgroundColor: "#eef2ff",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  saveHitDone: { backgroundColor: "#f3f4f6" },
  save: { color: "#4f46e5", fontWeight: "700", fontSize: 13 },
  saveDone: { color: "#6b7280" },
});
