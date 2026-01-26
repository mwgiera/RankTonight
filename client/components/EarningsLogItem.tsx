import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";
import {
  type EarningsLog,
  getPlatformDisplayName,
  getPlatformColor,
  getZoneById,
} from "@/lib/ranking-model";

interface EarningsLogItemProps {
  log: EarningsLog;
  onDelete?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function EarningsLogItem({ log, onDelete }: EarningsLogItemProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const platformColor = getPlatformColor(log.platform);
  const zone = getZoneById(log.zone);
  const date = new Date(log.timestamp);
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric" });

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
        animatedStyle,
      ]}
    >
      <View style={styles.leftSection}>
        <View style={[styles.platformIndicator, { backgroundColor: platformColor }]} />
        <View style={styles.info}>
          <ThemedText type="h4">{getPlatformDisplayName(log.platform)}</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {zone?.name || log.zone} - {log.duration}h
          </ThemedText>
        </View>
      </View>
      <View style={styles.rightSection}>
        <View style={styles.amountContainer}>
          <ThemedText type="h3" style={{ color: theme.primary }}>
            ${log.amount.toFixed(2)}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {dateStr} {timeStr}
          </ThemedText>
        </View>
        {onDelete ? (
          <Pressable onPress={onDelete} style={styles.deleteButton}>
            <Feather name="trash-2" size={18} color={theme.textSecondary} />
          </Pressable>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  platformIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  info: {
    gap: 2,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  deleteButton: {
    padding: Spacing.sm,
  },
});
