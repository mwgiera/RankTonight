import React, { useState, useCallback } from "react";
import { View, StyleSheet, Image, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
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
  getScoringMode,
  setScoringMode,
  getEarningsLogs,
  type UserPreferences,
} from "@/lib/storage";
import { useLanguage } from "@/lib/language-context";
import { LANGUAGES, type Language } from "@/lib/translations";
import type { ScoringMode } from "@/lib/dual-scorer";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [scoringMode, setScoringModeState] = useState<ScoringMode>("PILOT");
  const [recordCount, setRecordCount] = useState(0);
  const [adminTapCount, setAdminTapCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadPrefs();
      loadScoringMode();
      loadRecordCount();
    }, [])
  );

  const loadPrefs = async () => {
    const data = await getUserPreferences();
    setPrefs(data);
  };

  const loadScoringMode = async () => {
    const mode = await getScoringMode();
    setScoringModeState(mode);
  };

  const loadRecordCount = async () => {
    const logs = await getEarningsLogs();
    setRecordCount(logs.length);
  };

  const handleModeChange = async (mode: ScoringMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScoringModeState(mode);
    await setScoringMode(mode);
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

  const handleLanguageSelect = async (lang: Language) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setLanguage(lang);
    setShowLanguagePicker(false);
  };

  const handleClearData = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      t.profile.clearAllData,
      t.profile.clearDataConfirm,
      [
        { text: t.common.cancel, style: "cancel" },
        {
          text: t.profile.clearAllData,
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

  const handleVersionTap = () => {
    const newCount = adminTapCount + 1;
    setAdminTapCount(newCount);
    if (newCount >= 5) {
      setAdminTapCount(0);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate("AdminLogin");
    } else if (newCount >= 3) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const currentLanguage = LANGUAGES.find((l) => l.code === language);

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
            {t.profile.settings}
          </ThemedText>

          <View
            style={[styles.settingCard, { backgroundColor: theme.backgroundDefault }]}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Feather name="cpu" size={20} color={theme.text} />
                <ThemedText type="body" style={{ marginLeft: Spacing.md }}>
                  {t.profile.scoringMode}
                </ThemedText>
              </View>
            </View>
            <View style={styles.modeToggle}>
              <Pressable
                style={[
                  styles.modeOption,
                  scoringMode === "PILOT" && { backgroundColor: Colors.dark.primary + "30" },
                ]}
                onPress={() => handleModeChange("PILOT")}
              >
                <ThemedText
                  type="body"
                  style={{
                    color: scoringMode === "PILOT" ? Colors.dark.primary : theme.text,
                    fontWeight: scoringMode === "PILOT" ? "600" : "400",
                  }}
                >
                  {t.profile.pilotMode}
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: 2 }}>
                  {t.profile.pilotModeDesc}
                </ThemedText>
              </Pressable>
              <Pressable
                style={[
                  styles.modeOption,
                  scoringMode === "PERSONAL" && { backgroundColor: Colors.dark.success + "30" },
                ]}
                onPress={() => handleModeChange("PERSONAL")}
              >
                <ThemedText
                  type="body"
                  style={{
                    color: scoringMode === "PERSONAL" ? Colors.dark.success : theme.text,
                    fontWeight: scoringMode === "PERSONAL" ? "600" : "400",
                  }}
                >
                  {t.profile.personalMode}
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: 2 }}>
                  {t.profile.personalModeDesc} ({recordCount} records)
                </ThemedText>
              </Pressable>
            </View>
          </View>

          <View
            style={[styles.settingCard, { backgroundColor: theme.backgroundDefault, marginTop: Spacing.md }]}
          >
            <Pressable
              style={styles.settingRow}
              onPress={() => setShowLanguagePicker(!showLanguagePicker)}
            >
              <View style={styles.settingInfo}>
                <Feather name="globe" size={20} color={theme.text} />
                <ThemedText type="body" style={{ marginLeft: Spacing.md }}>
                  {t.profile.language}
                </ThemedText>
              </View>
              <View style={styles.languageValue}>
                <ThemedText type="body" style={{ color: Colors.dark.primary }}>
                  {currentLanguage?.nativeName}
                </ThemedText>
                <Feather
                  name={showLanguagePicker ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={theme.textSecondary}
                  style={{ marginLeft: Spacing.xs }}
                />
              </View>
            </Pressable>
            {showLanguagePicker ? (
              <View style={styles.languageDropdown}>
                {LANGUAGES.map((lang) => (
                  <Pressable
                    key={lang.code}
                    style={[
                      styles.languageOption,
                      lang.code === language && { backgroundColor: theme.backgroundSecondary },
                    ]}
                    onPress={() => handleLanguageSelect(lang.code)}
                  >
                    <ThemedText
                      type="body"
                      style={{
                        color: lang.code === language ? Colors.dark.primary : theme.text,
                        fontWeight: lang.code === language ? "600" : "400",
                      }}
                    >
                      {lang.nativeName}
                    </ThemedText>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                      {lang.name}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <View
            style={[styles.settingCard, { backgroundColor: theme.backgroundDefault, marginTop: Spacing.md }]}
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
            {t.profile.about}
          </ThemedText>

          <View
            style={[styles.settingCard, { backgroundColor: theme.backgroundDefault }]}
          >
            <Pressable style={styles.aboutRow} onPress={handleVersionTap}>
              <ThemedText type="body">{t.profile.version}</ThemedText>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                1.0.0
              </ThemedText>
            </Pressable>
            <View style={styles.creditsDivider} />
            <View style={styles.creditsSection}>
              <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center" }}>
                {t.profile.designedBy} Mateusz Giera
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.xs }}>
                {t.profile.developedBy} Codeinside
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.sm }}>
                {t.profile.license}
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
              {t.profile.clearAllData}
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
  languageValue: {
    flexDirection: "row",
    alignItems: "center",
  },
  languageDropdown: {
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: Spacing.md,
  },
  languageOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.xs,
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
  modeToggle: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  modeOption: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
});
