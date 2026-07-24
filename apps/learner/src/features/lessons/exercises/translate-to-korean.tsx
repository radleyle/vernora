import { isAcceptedAnswer } from "@vernora/content-schema";
import { useState } from "react";
import { StyleSheet, Text, TextInput } from "react-native";
import { Card, FeedbackBanner, PrimaryButton } from "../../../components/ui";
import type { ExerciseProps } from "../exercise-types";

export function TranslateToKoreanExercise({
  exercise,
  onComplete,
}: ExerciseProps<"TRANSLATE_TO_KOREAN">) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const correct = isAcceptedAnswer(answer, exercise.acceptedAnswers);

  function submit() {
    setSubmitted(true);
    onComplete(isAcceptedAnswer(answer, exercise.acceptedAnswers));
  }

  return (
    <Card>
      <Text style={styles.instruction}>{exercise.instruction.en}</Text>
      <Text style={styles.prompt}>“{exercise.prompt.en}”</Text>
      <TextInput
        style={styles.input}
        placeholder="한국어로 입력하세요"
        value={answer}
        onChangeText={setAnswer}
        editable={!submitted}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {!submitted && (
        <PrimaryButton
          label="Check"
          onPress={submit}
          disabled={answer.trim().length === 0}
        />
      )}
      {submitted && (
        <FeedbackBanner correct={correct}>
          {!correct && (
            <Text>Accepted answers: {exercise.acceptedAnswers.join(" / ")}</Text>
          )}
        </FeedbackBanner>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  instruction: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  prompt: { fontSize: 18, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#ffffff",
  },
});
