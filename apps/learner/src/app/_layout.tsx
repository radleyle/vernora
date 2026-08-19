import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Link, Stack } from "expo-router";
import { Text } from "react-native";
import { SessionProvider } from "../providers/session-provider";

const queryClient = new QueryClient();

function HomeHeaderLink() {
  return (
    <Link href="/" style={{ paddingHorizontal: 12 }}>
      <Text style={{ color: "#ffffff", fontWeight: "600" }}>Home</Text>
    </Link>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#1a1a2e" },
            headerTintColor: "#ffffff",
            headerRight: () => <HomeHeaderLink />,
          }}
        >
          <Stack.Screen
            name="index"
            options={{ title: "Vernora", headerRight: () => null }}
          />
          <Stack.Screen name="sign-in" options={{ title: "Sign in" }} />
        </Stack>
      </SessionProvider>
    </QueryClientProvider>
  );
}
