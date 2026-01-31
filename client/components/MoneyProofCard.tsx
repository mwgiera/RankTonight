import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

interface MoneyProofCardProps {
  baselineHourly: number;
  followedHourly: number;
  baselineCount: number;
  followedCount: number;
}

export function MoneyProofCard({
  baselineHourly,
  followedHourly,
  baselineCount,
  followedCount,
}: MoneyProofCardProps) {
  const { theme } = useTheme();
  
  const hasData = baselineCount > 0 || followedCount > 0;
  const difference = followedHourly - baselineHourly;
  const isPositive = difference > 0;
  const percentChange = baselineHourly > 0 ? ((difference / baselineHourly) * 100) : 0;
  
  if (!hasData) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
      <View style={styles.header}>
        <Feather name="trending-up" size={16} color={Colors.dark.primary} />
        <ThemedText type="body" style={{ marginLeft: Spacing.sm, fontWeight: "600" }}>
          Last 2 Hours
        </ThemedText>
      </View>
      
      <View style={styles.metricsRow}>
        <View style={styles.metricBlock}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            All Trips ({baselineCount})
          </ThemedText>
          <ThemedText type="h2">
            {baselineHourly > 0 ? `${Math.round(baselineHourly)}` : "—"}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            PLN/h
          </ThemedText>
        </View>
        
        <View style={[styles.vsBlock, { backgroundColor: theme.backgroundSecondary }]}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            vs
          </ThemedText>
        </View>
        
        <View style={styles.metricBlock}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Followed ({followedCount})
          </ThemedText>
          <ThemedText type="h2" style={{ color: isPositive ? Colors.dark.success : theme.text }}>
            {followedHourly > 0 ? `${Math.round(followedHourly)}` : "—"}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            PLN/h
          </ThemedText>
        </View>
      </View>
      
      {followedCount > 0 && baselineCount > 0 && difference !== 0 ? (
        <View style={[
          styles.differenceRow,
          { backgroundColor: isPositive ? Colors.dark.success + "20" : Colors.dark.danger + "20" }
        ]}>
          <Feather 
            name={isPositive ? "arrow-up-right" : "arrow-down-right"} 
            size={14} 
            color={isPositive ? Colors.dark.success : Colors.dark.danger} 
          />
          <ThemedText 
            type="body" 
            style={{ 
              color: isPositive ? Colors.dark.success : Colors.dark.danger,
              fontWeight: "600",
              marginLeft: Spacing.xs,
            }}
          >
            {isPositive ? "+" : ""}{Math.round(difference)} PLN/h ({isPositive ? "+" : ""}{Math.round(percentChange)}%)
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.sm }}>
            when following advice
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metricBlock: {
    flex: 1,
    alignItems: "center",
  },
  vsBlock: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  differenceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
});
