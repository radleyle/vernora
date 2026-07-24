import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card, FeedbackBanner } from "../../../components/ui";
import { speakKorean } from "../../../lib/tts";
import type { ExerciseProps } from "../exercise-types";
import { shuffle } from "../shuffle";

/**
 * Tap a Korean word, then its meaning. Completed when every pair is matched;
 * counted as correct only with zero mismatches.
 */
export function MatchPairsExercise({
  exercise,
  onComplete,
}: ExerciseProps<"MATCH_PAIRS">) {
  const meanings = useMemo(
    () => shuffle(exercise.pairs.map((pair) => pair.meaning.en)),
    [exercise],
  );
  const [selectedKorean, setSelectedKorean] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [done, setDone] = useState(false);

  function pickMeaning(meaning: string) {
    if (!selectedKorean || done) return;
    const pair = exercise.pairs.find((p) => p.korean === selectedKorean);
    if (pair?.meaning.en === meaning) {
      const next = new Set(matched).add(selectedKorean);
      setMatched(next);
      if (next.size === exercise.pairs.length) {
        setDone(true);
        onComplete(mistakes === 0);
      }
    } else {
      setMistakes((count) => count + 1);
    }
    setSelectedKorean(null);
  }

  return (
    <Card>
      <Text style={styles.instruction}>{exercise.instruction.en}</Text>
      <View style={styles.columns}>
        <View style={styles.column}>
          {exercise.pairs.map(({ korean }) => (
            <Pressable
              key={korean}
              disabled={matched.has(korean)}
              style={[
                styles.item,
                selectedKorean === korean && styles.itemSelected,
                matched.has(korean) && styles.itemMatched,
              ]}
              onPress={() => {
                setSelectedKorean(korean);
                speakKorean(korean);
              }}
            >
              <Text style={styles.itemText}>{korean}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.column}>
          {meanings.map((meaning) => {
            const isMatched = exercise.pairs.some(
              (pair) => pair.meaning.en === meaning && matched.has(pair.korean),
            );
            return (
              <Pressable
                key={meaning}
                disabled={isMatched}
                style={[styles.item, isMatched && styles.itemMatched]}
                onPress={() => pickMeaning(meaning)}
              >
                <Text style={styles.itemText}>{meaning}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      {done && (
        <FeedbackBanner correct={mistakes === 0}>
          {mistakes > 0 && <Text>All matched, with {mistakes} miss(es) — worth a review.</Text>}
        </FeedbackBanner>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  instruction: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  columns: { flexDirection: "row", gap: 12 },
  column: { flex: 1, gap: 8 },
  item: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
  },
  itemSelected: { borderColor: "#4f46e5", backgroundColor: "#eef2ff" },
  itemMatched: { borderColor: "#22c55e", backgroundColor: "#dcfce7" },
  itemText: { fontSize: 15, textAlign: "center" },
});
