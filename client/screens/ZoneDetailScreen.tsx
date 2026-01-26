import React, { useState, useMemo } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { PlatformCard } from "@/components/PlatformCard";
import { CategoryChip } from "@/components/CategoryChip";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import {
  calculateRankings,
  getZoneById,
  type RankingResult,
} from "@/lib/ranking-model";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type TimeOffset = "now" | "+1hr" | "+2hr" | "evening" | "night";

const TIME_OFFSETS: { key: TimeOffset; label: string; hours: number }[] = [
  { key: "now", label: "Now", hours: 0 },
  { key: "+1hr", label: "+1hr", hours: 1 },
  { key: "+2hr", label: "+2hr", hours: 2 },
  { key: "evening", label: "Evening", hours: 20 - new Date().getHours() },
  { key: "night", label: "Night", hours: 23 - new Date().getHours() },
];

export default function ZoneDetailScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const route = useRoute<RouteProp<RootStackParamList, "ZoneDetail">>();
  const { zoneId } = route.params;

  const [selectedTime, setSelectedTime] = useState<TimeOffset>("now");

  const zone = getZoneById(zoneId);

  const ranking = useMemo(() => {
    if (!zone) return null;
    const offset = TIME_OFFSETS.find((t) => t.key === selectedTime);
    const date = new Date();
    if (offset) {
      date.setHours(date.getHours() + offset.hours);
    }
    return calculateRankings(zone.category, date);
  }, [zone, selectedTime]);

  const handleTimeSelect = (time: TimeOffset) => {
    setSelectedTime(time);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  if (!zone || !ranking) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <ThemedText>Zone not found</ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <Animated.View entering={FadeInDown.delay(0).duration(300)}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {zone.category.toUpperCase()}
          </ThemedText>
          <ThemedText type="h1" style={{ marginBottom: Spacing.lg }}>
            {zone.name}
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(300)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.timeSelector}
            contentContainerStyle={styles.timeSelectorContent}
          >
            {TIME_OFFSETS.map((t) => (
              <CategoryChip
                key={t.key}
                label={t.label}
                isSelected={selectedTime === t.key}
                onPress={() => handleTimeSelect(t.key)}
              />
            ))}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(300)}>
          <View
            style={[
              styles.confidenceCard,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Confidence Level
            </ThemedText>
            <View style={styles.confidenceRow}>
              <ThemedText
                type="h2"
                style={{
                  color:
                    ranking.confidence === "Strong"
                      ? Colors.dark.success
                      : ranking.confidence === "Medium"
                      ? Colors.dark.warning
                      : Colors.dark.danger,
                }}
              >
                {ranking.confidence}
              </ThemedText>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                {Math.round(ranking.confidenceValue * 100)}% difference
              </ThemedText>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(300)}>
          <ThemedText
            type="h2"
            style={{ marginTop: Spacing["2xl"], marginBottom: Spacing.md }}
          >
            Platform Rankings
          </ThemedText>
          {ranking.rankings.map((r, index) => (
            <PlatformCard
              key={r.platform}
              platform={r.platform}
              probability={r.probability}
              rank={index + 1}
              isTop={index === 0}
            />
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(300)}>
          <View
            style={[
              styles.metricsCard,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <ThemedText type="h3" style={{ marginBottom: Spacing.md }}>
              Current Metrics
            </ThemedText>
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Demand
                </ThemedText>
                <ThemedText type="h2" style={{ color: Colors.dark.success }}>
                  {ranking.rankings[0].demandScore.toFixed(2)}
                </ThemedText>
              </View>
              <View style={styles.metricItem}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Friction
                </ThemedText>
                <ThemedText type="h2" style={{ color: Colors.dark.danger }}>
                  {ranking.rankings[0].frictionScore.toFixed(2)}
                </ThemedText>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
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
  timeSelector: {
    marginBottom: Spacing.lg,
  },
  timeSelectorContent: {
    paddingVertical: Spacing.sm,
  },
  confidenceCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  confidenceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  metricsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing["2xl"],
  },
  metricsGrid: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  metricItem: {
    flex: 1,
  },
});
