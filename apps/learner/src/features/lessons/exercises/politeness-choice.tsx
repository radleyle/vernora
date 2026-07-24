import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card, FeedbackBanner, PrimaryButton } from "../../../components/ui";
import type { ExerciseProps } from "../exercise-types";

const FORMALITY_LABEL: Record<string, string> = {
  FORMAL: "formal",
  POLITE: "polite",
  CASUAL: "casual",
};

export function PolitenessChoiceExercise({
  exercise,
  onComplete,
}: ExerciseProps<"POLITENESS_CHOICE">) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const correct = selected === exercise.correctIndex;

  function submit() {
    setSubmitted(true);
    onComplete(selected === exercise.correctIndex);
  }

  return (
    <Card>
      <Text style={styles.instruction}>{exercise.instruction.en}</Text>
      <View style={styles.situation}>
        <Text style={styles.situationText}>{exercise.situation.en}</Text>
      </View>
      {exercise.options.map((option, index) => (
        <Pressable
          key={index}
          disabled={submitted}
          style={[styles.option, selected === index && styles.optionSelected]}
          onPress={() => setSelected(index)}
        >
          <Text style={styles.optionKorean}>{option.korean}</Text>
          {submitted && (
            <Text style={styles.formality}>
              {FORMALITY_LABEL[option.formality]}
            </Text>
          )}
        </Pressable>
      ))}
      {!submitted && (
        <PrimaryButton label="Check" onPress={submit} disabled={selected === null} />
      )}
      {submitted && (
        <FeedbackBanner correct={correct}>
          <Text>{exercise.explanation.en}</Text>
        </FeedbackBanner>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  instruction: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  situation: {
    backgroundColor: "#fef9c3",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  situationText: { fontSize: 15, fontStyle: "italic" },
  option: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  optionSelected: { borderColor: "#4f46e5", backgroundColor: "#eef2ff" },
  optionKorean: { fontSize: 16 },
  formality: { color: "#6b7280", fontSize: 13, alignSelf: "center" },
});
