import { isCorrectTokenOrder } from "@vernora/content-schema";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card, FeedbackBanner, PrimaryButton } from "../../../components/ui";
import type { ExerciseProps } from "../exercise-types";
import { shuffle } from "../shuffle";

export function ArrangeTokensExercise({
  exercise,
  onComplete,
}: ExerciseProps<"ARRANGE_TOKENS">) {
  // Tokens are stored in correct order; present them shuffled (with
  // distractors mixed in). Indexes identify tiles so duplicates work.
  const tiles = useMemo(
    () => shuffle([...exercise.tokens, ...exercise.distractors]),
    [exercise],
  );
  const [arrangedIndexes, setArrangedIndexes] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const arranged = arrangedIndexes.map((index) => tiles[index]!);
  const correct = isCorrectTokenOrder(arranged, exercise.tokens);

  function submit() {
    setSubmitted(true);
    onComplete(isCorrectTokenOrder(arranged, exercise.tokens));
  }

  return (
    <Card>
      <Text style={styles.instruction}>{exercise.instruction.en}</Text>
      <View style={styles.answerRow}>
        {arranged.length === 0 && (
          <Text style={styles.placeholder}>Tap the words below in order</Text>
        )}
        {arrangedIndexes.map((tileIndex, position) => (
          <Pressable
            key={`${tileIndex}`}
            disabled={submitted}
            style={styles.tokenChosen}
            onPress={() =>
              setArrangedIndexes((current) =>
                current.filter((_, i) => i !== position),
              )
            }
          >
            <Text style={styles.tokenText}>{tiles[tileIndex]}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.bank}>
        {tiles.map((token, index) => {
          const used = arrangedIndexes.includes(index);
          return (
            <Pressable
              key={index}
              disabled={used || submitted}
              style={[styles.token, used && styles.tokenUsed]}
              onPress={() => setArrangedIndexes((current) => [...current, index])}
            >
              <Text style={styles.tokenText}>{token}</Text>
            </Pressable>
          );
        })}
      </View>
      {!submitted && (
        <PrimaryButton
          label="Check"
          onPress={submit}
          disabled={arrangedIndexes.length === 0}
        />
      )}
      {submitted && (
        <FeedbackBanner correct={correct}>
          <Text>
            {exercise.tokens.join(" ")} — {exercise.translation.en}
          </Text>
        </FeedbackBanner>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  instruction: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  answerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    minHeight: 52,
    borderBottomWidth: 2,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 8,
    marginBottom: 16,
  },
  placeholder: { color: "#9ca3af", alignSelf: "center" },
  bank: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  token: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#ffffff",
  },
  tokenUsed: { opacity: 0.3 },
  tokenChosen: {
    borderWidth: 1,
    borderColor: "#4f46e5",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#eef2ff",
  },
  tokenText: { fontSize: 16 },
});
