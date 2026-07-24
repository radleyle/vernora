import { Pressable, StyleSheet, Text } from "react-native";
import { Card, PrimaryButton } from "../../../components/ui";
import { speakKorean } from "../../../lib/tts";
import type { ExerciseProps } from "../exercise-types";

/**
 * Speaking practice, v1: listen to the model, say it aloud, self-report.
 * Recording and clarity feedback arrive with the speaking module (spec §20);
 * an honest placeholder beats fake assessment.
 */
export function SpeakExercise({ exercise, onComplete }: ExerciseProps<"SPEAK">) {
  return (
    <Card>
      <Text style={styles.instruction}>{exercise.instruction.en}</Text>
      <Text style={styles.target}>{exercise.targetText}</Text>
      <Text style={styles.translation}>{exercise.translation.en}</Text>
      <Pressable style={styles.play} onPress={() => speakKorean(exercise.targetText)}>
        <Text style={styles.playText}>🔊 Hear it</Text>
      </Pressable>
      <Text style={styles.note}>
        Say it out loud a few times. Recording with feedback is coming in a
        later version.
      </Text>
      <PrimaryButton label="I said it out loud" onPress={() => onComplete(true)} />
    </Card>
  );
}

const styles = StyleSheet.create({
  instruction: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  target: { fontSize: 28, fontWeight: "700", marginBottom: 4 },
  translation: { color: "#6b7280", marginBottom: 12 },
  play: { marginBottom: 12 },
  playText: { color: "#4f46e5", fontSize: 18, fontWeight: "600" },
  note: { color: "#6b7280", fontSize: 13, marginBottom: 8 },
});
