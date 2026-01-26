import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import type { ConfidenceLevel } from "@/lib/ranking-model";

interface ConfidenceBarProps {
  value: number;
  level: ConfidenceLevel;
}

export function ConfidenceBar({ value, level }: ConfidenceBarProps) {
  const { theme } = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(Math.min(value + 0.33, 1), {
      damping: 15,
      stiffness: 100,
    });
  }, [value]);

  const getColor = () => {
    switch (level) {
      case "Strong":
        return Colors.dark.success;
      case "Medium":
        return Colors.dark.warning;
      case "Weak":
        return Colors.dark.danger;
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
    backgroundColor: getColor(),
  }));

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          Confidence
        </ThemedText>
        <ThemedText
          type="small"
          style={[styles.levelLabel, { color: getColor() }]}
        >
          {level}
        </ThemedText>
      </View>
      <View style={[styles.track, { backgroundColor: theme.backgroundTertiary }]}>
        <Animated.View style={[styles.fill, animatedStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.md,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  levelLabel: {
    fontWeight: "600",
  },
  track: {
    height: 8,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: BorderRadius.full,
  },
});
