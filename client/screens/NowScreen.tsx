import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ScrollView, RefreshControl, Pressable, Platform as RNPlatform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ConfidenceBar } from "@/components/ConfidenceBar";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";
import { PlatformCard } from "@/components/PlatformCard";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { MoneyProofCard } from "@/components/MoneyProofCard";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import {
  getPlatformDisplayName,
  getPlatformColor,
  getZoneById,
  ZONES,
  findNearestZone,
  type PlatformScore,
} from "@/lib/ranking-model";
import { getSelectedZone, setSelectedZone, getEarningsLogs, getScoringMode, getUserPreferences } from "@/lib/storage";
import { getMoneyProofCounters, type MoneyProofCounters } from "@/lib/database";
import { getApiUrl } from "@/lib/query-client";
import { calculateDualRanking, type DualRankingResult, type ScoringMode } from "@/lib/dual-scorer";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useLanguage } from "@/lib/language-context";
import { getTimeRegimeLabelTranslated, getDayModeLabelTranslated } from "@/lib/translations";

export default function NowScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { language, t } = useLanguage();

  const [selectedZoneId, setSelectedZoneId] = useState("stare-miasto");
  const [ranking, setRanking] = useState<DualRankingResult | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showZonePicker, setShowZonePicker] = useState(false);
  const [scoringMode, setScoringModeState] = useState<ScoringMode>("PILOT");
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [moneyProof, setMoneyProof] = useState<MoneyProofCounters | null>(null);

  const pulseScale = useSharedValue(1);

  useFocusEffect(
    useCallback(() => {
      loadData();
      detectLocationZone();
      loadMoneyProof();
    }, [])
  );

  const loadMoneyProof = async () => {
    try {
      const counters = await getMoneyProofCounters();
      setMoneyProof(counters);
    } catch (error) {
      console.log("Failed to load money proof:", error);
    }
  };

  const detectLocationZone = async () => {
    if (RNPlatform.OS === "web") return;
    
    // Check opt-in first
    const currentPrefs = await getUserPreferences();
    if (!currentPrefs.dataSharingEnabled) return;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === "granted");
      
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        const nearestZone = findNearestZone(
          location.coords.latitude,
          location.coords.longitude
        );
        
        const savedZone = await getSelectedZone();
        if (savedZone === "stare-miasto") {
          setSelectedZoneId(nearestZone.id);
          await setSelectedZone(nearestZone.id);
        }

        // Anonymized zone sharing (only if opted-in)
        const apiUrl = getApiUrl();
        await fetch(new URL("/api/location", apiUrl).toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            zoneId: nearestZone.id,
            timestamp: Date.now()
          }),
        }).catch(() => {});
      }
    } catch (error) {
      console.log("Location detection failed:", error);
    }
  };

  useEffect(() => {
    calculateAndSetRanking();
  }, [selectedZoneId, scoringMode]);

  useEffect(() => {
    const interval = setInterval(() => {
      calculateAndSetRanking();
    }, 60000);
    return () => clearInterval(interval);
  }, [selectedZoneId, scoringMode]);

  const calculateAndSetRanking = async () => {
    const zone = getZoneById(selectedZoneId);
    if (zone) {
      const logs = await getEarningsLogs();
      const result = calculateDualRanking(scoringMode, logs, selectedZoneId, zone.category);
      setRanking(result);

      if (result.confidence === "Strong") {
        pulseScale.value = withRepeat(
          withSequence(
            withTiming(1.02, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
      } else {
        pulseScale.value = 1;
      }
    }
  };

  const loadData = async () => {
    const zoneId = await getSelectedZone();
    const mode = await getScoringMode();
    setSelectedZoneId(zoneId);
    setScoringModeState(mode);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadData();
    await loadMoneyProof();
    setRefreshing(false);
  }, []);

  const handleZoneSelect = async (zoneId: string) => {
    setSelectedZoneId(zoneId);
    await setSelectedZone(zoneId);
    setShowZonePicker(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleLogEarnings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("LogEarnings");
  };

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const now = new Date();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  const dayStr = dayNames[now.getDay()];
  const zone = getZoneById(selectedZoneId);
  const context = ranking?.context;

  if (!ranking) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <ThemedText>Loading...</ThemedText>
      </View>
    );
  }

  const topRanking = ranking.rankings[0];
  const alternativeRankings = ranking.rankings.slice(1);
  const isWeak = ranking.confidence === "Weak";

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl + 80,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.dark.primary}
          />
        }
      >
        <Animated.View entering={FadeInDown.delay(0).duration(400)}>
          <View style={styles.contextHeader}>
            <View style={styles.zoneNameRow}>
              <Feather name="map-pin" size={14} color={Colors.dark.primary} />
              <ThemedText type="h2" style={styles.zoneName}>
                {zone?.name || t.now.selectZone}
              </ThemedText>
            </View>
            {context ? (
              <View style={styles.contextBadges}>
                <View style={[styles.contextBadge, context.dayMode === "WEEKEND" && styles.contextBadgeActive]}>
                  <ThemedText type="caption" style={[styles.contextBadgeText, context.dayMode === "WEEKEND" && styles.contextBadgeTextActive]}>
                    {getDayModeLabelTranslated(context.dayMode, language)}
                  </ThemedText>
                </View>
                <View style={styles.contextDot} />
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  {getTimeRegimeLabelTranslated(context.timeRegime, language)}
                </ThemedText>
              </View>
            ) : null}
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
              {dayStr} {timeStr}
            </ThemedText>
          </View>

          <Pressable
            style={[styles.zonePicker, { backgroundColor: theme.backgroundDefault }]}
            onPress={() => setShowZonePicker(!showZonePicker)}
          >
            <View style={styles.zonePickerContent}>
              <Feather name="navigation" size={14} color={Colors.dark.primary} />
              <ThemedText type="body" style={{ marginLeft: Spacing.sm }}>
                {t.now.changeZone}
              </ThemedText>
            </View>
            <Feather
              name={showZonePicker ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.textSecondary}
            />
          </Pressable>

          {showZonePicker ? (
            <View style={[styles.zoneDropdown, { backgroundColor: theme.backgroundDefault }]}>
              {ZONES.map((z) => {
                const isSelected = z.id === selectedZoneId;
                const isLateNightBias = z.behaviorBias === "late-night bias";
                const isActiveNow = context?.timeRegime === "late-night" && isLateNightBias;
                return (
                  <Pressable
                    key={z.id}
                    style={[
                      styles.zoneOption,
                      isSelected && { backgroundColor: theme.backgroundSecondary },
                    ]}
                    onPress={() => handleZoneSelect(z.id)}
                  >
                    <View style={styles.zoneOptionLeft}>
                      {isActiveNow ? (
                        <Feather name="moon" size={12} color={Colors.dark.primary} style={{ marginRight: Spacing.xs }} />
                      ) : null}
                      <ThemedText
                        type="body"
                        style={{
                          color: isSelected ? Colors.dark.primary : theme.text,
                          fontWeight: isSelected ? "600" : "400",
                        }}
                      >
                        {z.name}
                      </ThemedText>
                    </View>
                    <ThemedText type="caption" style={{ color: isActiveNow ? Colors.dark.primary : theme.textSecondary }}>
                      {z.behaviorBias}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </Animated.View>

        {isWeak ? (
          <Animated.View
            entering={FadeInDown.delay(100).duration(500)}
            style={[
              { 
                backgroundColor: theme.backgroundDefault, 
                padding: Spacing.xl, 
                borderRadius: BorderRadius.md, 
                alignItems: "center",
                marginTop: Spacing.xl 
              }
            ]}
          >
            <Feather name="database" size={40} color={theme.textTertiary} style={{ marginBottom: Spacing.md }} />
            <ThemedText type="h2" style={{ textAlign: "center", marginBottom: Spacing.xs }}>
              Insufficient Data
            </ThemedText>
            <ThemedText type="body" style={{ textAlign: "center", color: theme.textSecondary }}>
              We need more logs for this zone and time to give a confident recommendation. Keep driving and log your earnings!
            </ThemedText>
            <Pressable
              onPress={handleLogEarnings}
              style={[
                { 
                  backgroundColor: Colors.dark.primary, 
                  paddingHorizontal: Spacing.xl, 
                  paddingVertical: Spacing.md, 
                  borderRadius: BorderRadius.sm,
                  marginTop: Spacing.xl 
                }
              ]}
            >
              <ThemedText style={{ color: "#FFF", fontWeight: "600" }}>Log First Trip</ThemedText>
            </Pressable>
          </Animated.View>
        ) : (
          <>
            <Animated.View
              entering={FadeInDown.delay(100).duration(400)}
              style={[
                styles.recommendationCard,
                { backgroundColor: theme.backgroundDefault, borderColor: Colors.dark.primary },
                pulseStyle,
              ]}
            >
              <View style={[styles.modeIndicator, { backgroundColor: ranking.mode === "PERSONAL" ? Colors.dark.success + "20" : Colors.dark.primary + "20" }]}>
                <Feather 
                  name={ranking.mode === "PERSONAL" ? "user" : "activity"} 
                  size={12} 
                  color={ranking.mode === "PERSONAL" ? Colors.dark.success : Colors.dark.primary} 
                />
                <ThemedText type="caption" style={{ 
                  color: ranking.mode === "PERSONAL" ? Colors.dark.success : Colors.dark.primary,
                  marginLeft: Spacing.xs,
                  fontWeight: "500",
                }}>
                  {ranking.mode === "PERSONAL" ? t.now.profitability : t.now.opportunityScore}
                </ThemedText>
                {ranking.mode === "PILOT" && ranking.currentRecordCount > 0 ? (
                  <ThemedText type="caption" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                    ({ranking.currentRecordCount}/{ranking.minRecordsRequired} {t.now.needMoreRecords.split(" ")[0]})
                  </ThemedText>
                ) : null}
              </View>

              <View style={styles.contextConfidenceRow}>
                <View style={styles.contextSummary}>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {t.now.basedOn.toUpperCase()}
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: theme.text, marginTop: 2 }}>
                    {zone?.name}
                  </ThemedText>
                  {context ? (
                    <>
                      <ThemedText type="caption" style={{ color: context.dayMode === "WEEKEND" ? Colors.dark.primary : theme.textSecondary }}>
                        {getDayModeLabelTranslated(context.dayMode, language)}
                      </ThemedText>
                      <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                        {getTimeRegimeLabelTranslated(context.timeRegime, language)}
                      </ThemedText>
                    </>
                  ) : null}
                </View>
                <View style={styles.confidenceSummary}>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {t.now.confidence.toUpperCase()}
                  </ThemedText>
                  <View style={[styles.confidenceBadge, 
                    ranking.confidence === "Strong" && { backgroundColor: Colors.dark.success + "30" },
                    ranking.confidence === "Medium" && { backgroundColor: Colors.dark.warning + "30" },
                    ranking.confidence === "Weak" && { backgroundColor: Colors.dark.danger + "30" },
                  ]}>
                    <ThemedText type="body" style={[
                      { fontWeight: "600" },
                      ranking.confidence === "Strong" && { color: Colors.dark.success },
                      ranking.confidence === "Medium" && { color: Colors.dark.warning },
                      ranking.confidence === "Weak" && { color: Colors.dark.danger },
                    ]}>
                      {ranking.confidence === "Strong" ? t.now.strong : ranking.confidence === "Medium" ? t.now.medium : t.now.weak}
                    </ThemedText>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.cardHeader}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {t.now.topPick}
                </ThemedText>
              </View>
              <View style={styles.platformRow}>
                <View
                  style={[
                    styles.platformColorBar,
                    { backgroundColor: getPlatformColor(topRanking!.platform) },
                  ]}
                />
                <ThemedText type="hero" style={styles.platformName}>
                  {getPlatformDisplayName(topRanking!.platform)}
                </ThemedText>
              </View>
              <ConfidenceBar value={ranking.confidenceValue} level={ranking.confidence} />
              <ScoreBreakdown
                demand={topRanking!.demandScore}
                friction={topRanking!.frictionScore}
                incentive={topRanking!.incentiveScore}
                reliability={topRanking!.reliabilityScore}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              <ThemedText
                type="h2"
                style={{ marginTop: Spacing["2xl"], marginBottom: Spacing.md }}
              >
                {t.now.alternativeOptions}
              </ThemedText>
              {alternativeRankings.map((r, index) => (
                <PlatformCard
                  key={r.platform}
                  platform={r.platform}
                  probability={r.probability}
                  rank={index + 2}
                />
              ))}
            </Animated.View>
          </>
        )}

        {moneyProof ? (
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <MoneyProofCard
              baselineHourly={moneyProof.baselineHourly}
              followedHourly={moneyProof.followedHourly}
              baselineCount={moneyProof.baselineCount}
              followedCount={moneyProof.followedCount}
            />
          </Animated.View>
        ) : null}
      </ScrollView>

      <FloatingActionButton
        icon="plus"
        onPress={handleLogEarnings}
        bottom={tabBarHeight + Spacing.lg}
      />
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
  contextHeader: {
    marginBottom: Spacing.lg,
  },
  zoneNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  zoneName: {
    marginLeft: Spacing.xs,
  },
  contextBadges: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  contextBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  contextBadgeActive: {
    backgroundColor: Colors.dark.primary + "30",
  },
  contextBadgeText: {
    color: "rgba(255,255,255,0.6)",
  },
  contextBadgeTextActive: {
    color: Colors.dark.primary,
  },
  contextDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  zonePicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  zonePickerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  zoneDropdown: {
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  zoneOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
  },
  zoneOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  recommendationCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  contextConfidenceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  contextSummary: {
    flex: 1,
  },
  confidenceSummary: {
    alignItems: "flex-end",
  },
  confidenceBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: Spacing.md,
  },
  cardHeader: {
    marginBottom: Spacing.sm,
  },
  platformRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  platformColorBar: {
    width: 6,
    height: 48,
    borderRadius: 3,
    marginRight: Spacing.md,
  },
  platformName: {},
  modeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
});
