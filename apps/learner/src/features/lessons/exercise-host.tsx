import type { Exercise } from "@vernora/content-schema";
import { Text } from "react-native";
import { Card, PrimaryButton } from "../../components/ui";
import { ArrangeTokensExercise } from "./exercises/arrange-tokens";
import { ListenAndSelectExercise } from "./exercises/listen-and-select";
import { MatchPairsExercise } from "./exercises/match-pairs";
import { PolitenessChoiceExercise } from "./exercises/politeness-choice";
import { SpeakExercise } from "./exercises/speak";
import { TranslateToKoreanExercise } from "./exercises/translate-to-korean";

/**
 * Dispatches an exercise to its renderer. TypeScript narrows `exercise`
 * inside each case via the discriminated union's `type` field.
 */
export function ExerciseHost({
  exercise,
  onComplete,
}: {
  exercise: Exercise;
  onComplete: (correct: boolean) => void;
}) {
  switch (exercise.type) {
    case "LISTEN_AND_SELECT":
      return <ListenAndSelectExercise exercise={exercise} onComplete={onComplete} />;
    case "MATCH_PAIRS":
      return <MatchPairsExercise exercise={exercise} onComplete={onComplete} />;
    case "ARRANGE_TOKENS":
      return <ArrangeTokensExercise exercise={exercise} onComplete={onComplete} />;
    case "POLITENESS_CHOICE":
      return <PolitenessChoiceExercise exercise={exercise} onComplete={onComplete} />;
    case "TRANSLATE_TO_KOREAN":
      return <TranslateToKoreanExercise exercise={exercise} onComplete={onComplete} />;
    case "SPEAK":
      return <SpeakExercise exercise={exercise} onComplete={onComplete} />;
    default:
      // Content may gain new exercise types before this app supports them;
      // skip gracefully rather than trapping the learner mid-lesson.
      return (
        <Card>
          <Text>This exercise type isn't supported yet.</Text>
          <PrimaryButton label="Skip" onPress={() => onComplete(true)} />
        </Card>
      );
  }
}
