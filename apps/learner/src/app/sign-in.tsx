import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { getSupabase } from "../lib/supabase";

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(mode: "signIn" | "signUp") {
    setBusy(true);
    setError(null);
    try {
      const supabase = getSupabase();
      const { error: authError } =
        mode === "signIn"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });
      if (authError) {
        setError(authError.message);
        return;
      }
      router.replace("/");
    } catch (configError) {
      setError((configError as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Welcome to Vernora</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        autoComplete="email"
        inputMode="email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable
        style={[styles.button, busy && styles.buttonDisabled]}
        disabled={busy}
        onPress={() => submit("signIn")}
      >
        <Text style={styles.buttonText}>Sign in</Text>
      </Pressable>
      <Pressable
        style={[styles.buttonSecondary, busy && styles.buttonDisabled]}
        disabled={busy}
        onPress={() => submit("signUp")}
      >
        <Text style={styles.buttonSecondaryText}>Create account</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
    backgroundColor: "#f7f7fb",
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
  },
  heading: { fontSize: 24, fontWeight: "700", marginBottom: 12 },
  input: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 14,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#4f46e5",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  buttonText: { color: "#ffffff", fontWeight: "600", fontSize: 16 },
  buttonSecondary: { padding: 14, alignItems: "center" },
  buttonSecondaryText: { color: "#4f46e5", fontWeight: "600", fontSize: 16 },
  buttonDisabled: { opacity: 0.5 },
  error: { color: "#b91c1c" },
});
