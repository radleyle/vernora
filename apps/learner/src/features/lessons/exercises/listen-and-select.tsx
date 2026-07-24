import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { Card, FeedbackBanner, PrimaryButton } from "../../../components/ui";
import { speakKorean } from "../../../lib/tts";
import type { ExerciseProps } from "../exercise-types";

export function ListenAndSelectExercise({
  exercise,
  onComplete,
}: ExerciseProps<"LISTEN_AND_SELECT">) {
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
      <Pressable style={styles.play} onPress={() => speakKorean(exercise.audioText)}>
        <Text style={styles.playText}>🔊 Play audio</Text>
      </Pressable>
      {exercise.options.map((option, index) => (
        <Pressable
          key={index}
          disabled={submitted}
          style={[styles.option, selected === index && styles.optionSelected]}
          onPress={() => setSelected(index)}
        >
          <Text style={styles.optionText}>
            {option.korean ?? option.meaning?.en}
          </Text>
        </Pressable>
      ))}
      {!submitted && (
        <PrimaryButton label="Check" onPress={submit} disabled={selected === null} />
      )}
      {submitted && (
        <FeedbackBanner correct={correct}>
          {!correct && (
            <Text>
              You heard: {exercise.audioText} —{" "}
              {exercise.options[exercise.correctIndex]?.meaning?.en}
            </Text>
          )}
        </FeedbackBanner>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  instruction: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  play: { marginBottom: 12 },
  playText: { color: "#4f46e5", fontSize: 18, fontWeight: "600" },
  option: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  optionSelected: { borderColor: "#4f46e5", backgroundColor: "#eef2ff" },
  optionText: { fontSize: 16 },
});
