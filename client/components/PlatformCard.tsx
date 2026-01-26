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
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import {
  type Platform,
  getPlatformDisplayName,
  getPlatformColor,
} from "@/lib/ranking-model";

interface PlatformCardProps {
  platform: Platform;
  probability: number;
  rank: number;
  isTop?: boolean;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PlatformCard({
  platform,
  probability,
  rank,
  isTop = false,
  onPress,
}: PlatformCardProps) {
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

  const platformColor = getPlatformColor(platform);
  const percentage = Math.round(probability * 100);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        {
          backgroundColor: isTop ? theme.backgroundSecondary : theme.backgroundDefault,
          borderColor: isTop ? Colors.dark.primary : theme.border,
          borderWidth: isTop ? 2 : 1,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.leftSection}>
        <View
          style={[
            styles.rankBadge,
            { backgroundColor: isTop ? Colors.dark.primary : theme.backgroundTertiary },
          ]}
        >
          <ThemedText type="caption" style={{ color: "#FFFFFF", fontWeight: "700" }}>
            {rank}
          </ThemedText>
        </View>
        <View style={[styles.platformIndicator, { backgroundColor: platformColor }]} />
        <ThemedText type={isTop ? "h2" : "h3"} style={styles.platformName}>
          {getPlatformDisplayName(platform)}
        </ThemedText>
      </View>
      <View style={styles.rightSection}>
        <ThemedText
          type="h3"
          style={{ color: isTop ? Colors.dark.success : theme.textSecondary }}
        >
          {percentage}%
        </ThemedText>
        <Feather
          name="chevron-right"
          size={20}
          color={theme.textSecondary}
        />
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
    marginBottom: Spacing.sm,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  platformIndicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
  },
  platformName: {
    fontWeight: "600",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
});
