import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ScrollView, RefreshControl, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
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
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import {
  calculateRankings,
  getPlatformDisplayName,
  getPlatformColor,
  getZoneById,
  ZONES,
  type RankingResult,
  type ContextMode,
} from "@/lib/ranking-model";
import { getSelectedZone, setSelectedZone } from "@/lib/storage";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

export default function NowScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [selectedZoneId, setSelectedZoneId] = useState("downtown");
  const [ranking, setRanking] = useState<RankingResult | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showZonePicker, setShowZonePicker] = useState(false);

  const pulseScale = useSharedValue(1);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const zone = getZoneById(selectedZoneId);
    if (zone) {
      const result = calculateRankings(zone.category);
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
  }, [selectedZoneId]);

  const loadData = async () => {
    const zoneId = await getSelectedZone();
    setSelectedZoneId(zoneId);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadData();
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
                {zone?.name || "Select Zone"}
              </ThemedText>
            </View>
            {context ? (
              <View style={styles.contextBadges}>
                <View style={[styles.contextBadge, context.dayMode === "WEEKEND" && styles.contextBadgeActive]}>
                  <ThemedText type="caption" style={[styles.contextBadgeText, context.dayMode === "WEEKEND" && styles.contextBadgeTextActive]}>
                    {context.dayModeLabel}
                  </ThemedText>
                </View>
                <View style={styles.contextDot} />
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  {context.timeRegimeLabel}
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
                Change Zone
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

        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={[
            styles.recommendationCard,
            { backgroundColor: theme.backgroundDefault, borderColor: Colors.dark.primary },
            pulseStyle,
          ]}
        >
          <View style={styles.contextConfidenceRow}>
            <View style={styles.contextSummary}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                CONTEXT
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.text, marginTop: 2 }}>
                {zone?.name}
              </ThemedText>
              {context ? (
                <>
                  <ThemedText type="caption" style={{ color: context.dayMode === "WEEKEND" ? Colors.dark.primary : theme.textSecondary }}>
                    {context.dayModeLabel}
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    {context.timeRegimeLabel}
                  </ThemedText>
                </>
              ) : null}
            </View>
            <View style={styles.confidenceSummary}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                CONFIDENCE
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
                  {ranking.confidence}
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.cardHeader}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              BEST CHOICE NOW
            </ThemedText>
          </View>
          <View style={styles.platformRow}>
            <View
              style={[
                styles.platformColorBar,
                { backgroundColor: getPlatformColor(topRanking.platform) },
              ]}
            />
            <ThemedText type="hero" style={styles.platformName}>
              {getPlatformDisplayName(topRanking.platform)}
            </ThemedText>
          </View>
          <ConfidenceBar value={ranking.confidenceValue} level={ranking.confidence} />
          <ScoreBreakdown
            demand={topRanking.demandScore}
            friction={topRanking.frictionScore}
            incentive={topRanking.incentiveScore}
            reliability={topRanking.reliabilityScore}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <ThemedText
            type="h2"
            style={{ marginTop: Spacing["2xl"], marginBottom: Spacing.md }}
          >
            Alternatives
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
});
