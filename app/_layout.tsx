import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { supabase } from "../lib/supabase";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import type { User } from "@supabase/supabase-js";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isLoading, setIsLoading] = React.useState(true);
  const [user, setUser] = React.useState<User | null>(null);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/signin");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)/home");
    }
  }, [user, segments, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
});
