import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { SessionProvider } from "../providers/session-provider";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#1a1a2e" },
            headerTintColor: "#ffffff",
          }}
        >
          <Stack.Screen name="index" options={{ title: "Vernora" }} />
          <Stack.Screen name="sign-in" options={{ title: "Sign in" }} />
        </Stack>
      </SessionProvider>
    </QueryClientProvider>
  );
}
