import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import {
  type Platform,
  getAllPlatforms,
  getPlatformDisplayName,
  getPlatformColor,
  ZONES,
} from "@/lib/ranking-model";
import { saveEarningsLog, type EarningsLog } from "@/lib/storage";

const DURATION_OPTIONS = [
  { label: "1 hour", value: 1 },
  { label: "2 hours", value: 2 },
  { label: "3 hours", value: 3 },
  { label: "4 hours", value: 4 },
];

export default function LogEarningsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation();

  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [amount, setAmount] = useState("");
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const platforms = getAllPlatforms();

  const handleSubmit = async () => {
    if (!selectedPlatform || !amount || !selectedZone) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const log: EarningsLog = {
      id: Date.now().toString(),
      platform: selectedPlatform,
      amount: parseFloat(amount),
      zone: selectedZone,
      duration,
      timestamp: Date.now(),
    };

    await saveEarningsLog(log);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  };

  const isValid = selectedPlatform && amount && parseFloat(amount) > 0 && selectedZone;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <Animated.View entering={FadeInDown.delay(0).duration(300)}>
          <ThemedText type="h2" style={{ marginBottom: Spacing.lg }}>
            Select Platform
          </ThemedText>
          <View style={styles.platformGrid}>
            {platforms.map((p) => (
              <Pressable
                key={p}
                style={[
                  styles.platformOption,
                  {
                    backgroundColor:
                      selectedPlatform === p
                        ? theme.backgroundSecondary
                        : theme.backgroundDefault,
                    borderColor:
                      selectedPlatform === p ? getPlatformColor(p) : theme.border,
                    borderWidth: selectedPlatform === p ? 2 : 1,
                  },
                ]}
                onPress={() => {
                  setSelectedPlatform(p);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <View
                  style={[styles.platformDot, { backgroundColor: getPlatformColor(p) }]}
                />
                <ThemedText type="body">{getPlatformDisplayName(p)}</ThemedText>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(300)}>
          <ThemedText type="h2" style={{ marginTop: Spacing.xl, marginBottom: Spacing.md }}>
            Amount Earned
          </ThemedText>
          <View
            style={[
              styles.amountInput,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
            ]}
          >
            <ThemedText type="h2" style={{ color: Colors.dark.primary }}>
              $
            </ThemedText>
            <TextInput
              style={[styles.amountTextInput, { color: theme.text }]}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(300)}>
          <ThemedText type="h2" style={{ marginTop: Spacing.xl, marginBottom: Spacing.md }}>
            Zone
          </ThemedText>
          <View style={styles.zoneGrid}>
            {ZONES.map((z) => (
              <Pressable
                key={z.id}
                style={[
                  styles.zoneOption,
                  {
                    backgroundColor:
                      selectedZone === z.id
                        ? theme.backgroundSecondary
                        : theme.backgroundDefault,
                    borderColor:
                      selectedZone === z.id ? Colors.dark.primary : theme.border,
                    borderWidth: selectedZone === z.id ? 2 : 1,
                  },
                ]}
                onPress={() => {
                  setSelectedZone(z.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <ThemedText
                  type="small"
                  style={{
                    color: selectedZone === z.id ? Colors.dark.primary : theme.text,
                  }}
                >
                  {z.name}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(300)}>
          <ThemedText type="h2" style={{ marginTop: Spacing.xl, marginBottom: Spacing.md }}>
            Duration
          </ThemedText>
          <View style={styles.durationGrid}>
            {DURATION_OPTIONS.map((d) => (
              <Pressable
                key={d.value}
                style={[
                  styles.durationOption,
                  {
                    backgroundColor:
                      duration === d.value
                        ? theme.backgroundSecondary
                        : theme.backgroundDefault,
                    borderColor:
                      duration === d.value ? Colors.dark.primary : theme.border,
                    borderWidth: duration === d.value ? 2 : 1,
                  },
                ]}
                onPress={() => {
                  setDuration(d.value);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <ThemedText
                  type="small"
                  style={{
                    color: duration === d.value ? Colors.dark.primary : theme.text,
                  }}
                >
                  {d.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(300)}>
          <Button
            onPress={handleSubmit}
            disabled={!isValid || isSubmitting}
            style={styles.submitButton}
          >
            {isSubmitting ? "Saving..." : "Log Earnings"}
          </Button>
        </Animated.View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  platformGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  platformOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  platformDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  amountInput: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  amountTextInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: "700",
    marginLeft: Spacing.sm,
  },
  zoneGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  zoneOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  durationGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  durationOption: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  submitButton: {
    marginTop: Spacing["3xl"],
  },
});
