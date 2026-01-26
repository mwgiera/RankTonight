import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Image, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import Slider from "@react-native-community/slider";

import { ThemedText } from "@/components/ThemedText";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import {
  getUserPreferences,
  saveUserPreferences,
  clearAllData,
  type UserPreferences,
} from "@/lib/storage";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();

  const [prefs, setPrefs] = useState<UserPreferences | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadPrefs();
    }, [])
  );

  const loadPrefs = async () => {
    const data = await getUserPreferences();
    setPrefs(data);
  };

  const handleTemperatureChange = async (value: number) => {
    if (!prefs) return;
    const newPrefs = { ...prefs, temperature: value };
    setPrefs(newPrefs);
    await saveUserPreferences({ temperature: value });
  };

  const handleNotificationsToggle = async () => {
    if (!prefs) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newPrefs = { ...prefs, notificationsEnabled: !prefs.notificationsEnabled };
    setPrefs(newPrefs);
    await saveUserPreferences({ notificationsEnabled: newPrefs.notificationsEnabled });
  };

  const handleClearData = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Clear All Data",
      "This will delete all your logged earnings and preferences. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await clearAllData();
            await loadPrefs();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  if (!prefs) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <ThemedText>Loading...</ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <Animated.View
          entering={FadeInDown.delay(0).duration(300)}
          style={styles.avatarSection}
        >
          <Image
            source={require("../../assets/images/avatar-preset.png")}
            style={styles.avatar}
            resizeMode="cover"
          />
          <ThemedText type="h1" style={{ marginTop: Spacing.md }}>
            {prefs.name}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Multi-Platform Driver
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(300)}>
          <ThemedText
            type="h2"
            style={{ marginTop: Spacing["2xl"], marginBottom: Spacing.md }}
          >
            Preferences
          </ThemedText>

          <View
            style={[styles.settingCard, { backgroundColor: theme.backgroundDefault }]}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Feather name="bell" size={20} color={theme.text} />
                <ThemedText type="body" style={{ marginLeft: Spacing.md }}>
                  Notifications
                </ThemedText>
              </View>
              <Pressable
                onPress={handleNotificationsToggle}
                style={[
                  styles.toggle,
                  {
                    backgroundColor: prefs.notificationsEnabled
                      ? Colors.dark.success
                      : theme.backgroundTertiary,
                  },
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    {
                      transform: [
                        { translateX: prefs.notificationsEnabled ? 20 : 0 },
                      ],
                    },
                  ]}
                />
              </Pressable>
            </View>
            <ThemedText
              type="caption"
              style={{ color: theme.textSecondary, marginTop: Spacing.xs }}
            >
              Get alerts when top platform changes in your zone
            </ThemedText>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(300)}>
          <View
            style={[
              styles.settingCard,
              { backgroundColor: theme.backgroundDefault, marginTop: Spacing.md },
            ]}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Feather name="sliders" size={20} color={theme.text} />
                <ThemedText type="body" style={{ marginLeft: Spacing.md }}>
                  Confidence Threshold
                </ThemedText>
              </View>
              <ThemedText type="body" style={{ color: Colors.dark.primary }}>
                {prefs.temperature.toFixed(1)}
              </ThemedText>
            </View>
            <Slider
              style={styles.slider}
              value={prefs.temperature}
              onSlidingComplete={handleTemperatureChange}
              minimumValue={0.5}
              maximumValue={2.0}
              step={0.1}
              minimumTrackTintColor={Colors.dark.primary}
              maximumTrackTintColor={theme.backgroundTertiary}
              thumbTintColor={Colors.dark.primary}
            />
            <ThemedText
              type="caption"
              style={{ color: theme.textSecondary, marginTop: Spacing.xs }}
            >
              Lower values = more decisive recommendations
            </ThemedText>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(300)}>
          <ThemedText
            type="h2"
            style={{ marginTop: Spacing["2xl"], marginBottom: Spacing.md }}
          >
            About
          </ThemedText>

          <View
            style={[styles.settingCard, { backgroundColor: theme.backgroundDefault }]}
          >
            <View style={styles.aboutRow}>
              <ThemedText type="body">Model Version</ThemedText>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                1.0.0
              </ThemedText>
            </View>
            <View style={[styles.aboutRow, { marginTop: Spacing.md }]}>
              <ThemedText type="body">App Version</ThemedText>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                1.0.0
              </ThemedText>
            </View>
            <View style={styles.creditsDivider} />
            <View style={styles.creditsSection}>
              <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center" }}>
                Designed by Mateusz Giera
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.xs }}>
                Developed by Codeinside
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.sm }}>
                All rights reserved | MIT License
              </ThemedText>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(300)}>
          <Pressable
            onPress={handleClearData}
            style={[
              styles.dangerButton,
              { backgroundColor: theme.backgroundDefault, borderColor: Colors.dark.danger },
            ]}
          >
            <Feather name="trash-2" size={20} color={Colors.dark.danger} />
            <ThemedText type="body" style={{ color: Colors.dark.danger, marginLeft: Spacing.sm }}>
              Clear All Data
            </ThemedText>
          </Pressable>
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
  avatarSection: {
    alignItems: "center",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1A1F2E",
  },
  settingCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 5,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  slider: {
    marginTop: Spacing.md,
    height: 40,
  },
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  creditsDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: Spacing.lg,
  },
  creditsSection: {
    alignItems: "center",
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing["2xl"],
  },
});
