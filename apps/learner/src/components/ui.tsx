import type { PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function Card({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[styles.button, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

/** Post-answer feedback banner: green for correct, red for incorrect. */
export function FeedbackBanner({
  correct,
  children,
}: PropsWithChildren<{ correct: boolean }>) {
  return (
    <View style={[styles.banner, correct ? styles.bannerOk : styles.bannerBad]}>
      <Text style={styles.bannerTitle}>
        {correct ? "Correct!" : "Not quite."}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#4f46e5",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#ffffff", fontWeight: "600", fontSize: 16 },
  disabled: { opacity: 0.4 },
  banner: { borderRadius: 10, padding: 14, marginTop: 12 },
  bannerOk: { backgroundColor: "#dcfce7" },
  bannerBad: { backgroundColor: "#fee2e2" },
  bannerTitle: { fontWeight: "700", marginBottom: 4 },
});
