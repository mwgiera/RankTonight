import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { getApiUrl } from "@/lib/query-client";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "AdminLogin">;

const ADMIN_TOKEN_KEY = "@driveradar:admin_token";

export default function AdminLoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!password.trim()) {
      setError("Password required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(new URL("/api/admin/login", apiUrl).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      await AsyncStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace("AdminDashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot, paddingTop: insets.top + Spacing.xl }]}>
      <View style={styles.header}>
        <Feather name="shield" size={48} color={theme.primary} />
        <Text style={[styles.title, { color: theme.text }]}>Admin Access</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Enter admin password to continue</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={[styles.input, { backgroundColor: theme.backgroundDefault, borderColor: theme.border, color: theme.text }]}
          placeholder="Password"
          placeholderTextColor={theme.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}

        <Pressable
          style={[styles.button, { backgroundColor: theme.primary }, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.backgroundRoot} />
          ) : (
            <Text style={[styles.buttonText, { color: theme.buttonText }]}>Login</Text>
          )}
        </Pressable>

        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.backButtonText, { color: theme.textSecondary }]}>Back to App</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: "center",
    marginTop: Spacing["3xl"],
    marginBottom: Spacing["3xl"],
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginTop: Spacing.md,
  },
  subtitle: {
    fontSize: 16,
    marginTop: Spacing.xs,
  },
  form: {
    gap: Spacing.md,
  },
  input: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    fontSize: 16,
    borderWidth: 1,
  },
  error: {
    fontSize: 14,
    textAlign: "center",
  },
  button: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  backButtonText: {
    fontSize: 16,
  },
});
