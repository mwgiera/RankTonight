import React from "react";
import { View, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";

interface ScoreBreakdownProps {
  demand: number;
  friction: number;
  incentive: number;
  reliability: number;
}

export function ScoreBreakdown({
  demand,
  friction,
  incentive,
  reliability,
}: ScoreBreakdownProps) {
  const { theme } = useTheme();

  const total = demand + friction + incentive + reliability;
  const demandPercent = (demand / total) * 100;
  const frictionPercent = (friction / total) * 100;
  const incentivePercent = (incentive / total) * 100;
  const reliabilityPercent = (reliability / total) * 100;

  return (
    <View style={styles.container}>
      <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
        Score Breakdown
      </ThemedText>
      <View style={[styles.barContainer, { backgroundColor: theme.backgroundTertiary }]}>
        <View
          style={[styles.segment, { width: `${demandPercent}%`, backgroundColor: Colors.dark.success }]}
        />
        <View
          style={[styles.segment, { width: `${frictionPercent}%`, backgroundColor: Colors.dark.danger }]}
        />
        <View
          style={[styles.segment, { width: `${incentivePercent}%`, backgroundColor: Colors.dark.warning }]}
        />
        <View
          style={[styles.segment, { width: `${reliabilityPercent}%`, backgroundColor: Colors.dark.primary }]}
        />
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.dark.success }]} />
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Demand
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.dark.danger }]} />
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Friction
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.dark.warning }]} />
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Incentive
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.dark.primary }]} />
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Reliable
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.lg,
  },
  barContainer: {
    height: 12,
    borderRadius: BorderRadius.full,
    flexDirection: "row",
    overflow: "hidden",
  },
  segment: {
    height: "100%",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
