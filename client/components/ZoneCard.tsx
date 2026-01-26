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
  type Zone,
  type Platform,
  getPlatformDisplayName,
  getPlatformColor,
  calculateRankings,
  getDemandLevel,
  getFrictionLevel,
} from "@/lib/ranking-model";

interface ZoneCardProps {
  zone: Zone;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ZoneCard({ zone, onPress }: ZoneCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const ranking = calculateRankings(zone.category);
  const topPlatform = ranking.topPlatform;
  const demandLevel = getDemandLevel(ranking.rankings[0].demandScore);
  const frictionLevel = getFrictionLevel(ranking.rankings[0].frictionScore);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const getDemandColor = (level: string) => {
    if (level === "High") return Colors.dark.success;
    if (level === "Medium") return Colors.dark.warning;
    return Colors.dark.danger;
  };

  const getFrictionColor = (level: string) => {
    if (level === "Low") return Colors.dark.success;
    if (level === "Medium") return Colors.dark.warning;
    return Colors.dark.danger;
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
        animatedStyle,
      ]}
    >
      <View style={styles.header}>
        <ThemedText type="h3">{zone.name}</ThemedText>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </View>
      <View style={styles.content}>
        <View style={styles.infoRow}>
          <View style={styles.platformInfo}>
            <View
              style={[styles.platformDot, { backgroundColor: getPlatformColor(topPlatform) }]}
            />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Top: {getPlatformDisplayName(topPlatform)}
            </ThemedText>
          </View>
        </View>
        <View style={styles.indicatorsRow}>
          <View style={styles.indicator}>
            <Feather name="trending-up" size={14} color={getDemandColor(demandLevel)} />
            <ThemedText
              type="caption"
              style={{ color: getDemandColor(demandLevel), marginLeft: 4 }}
            >
              {demandLevel}
            </ThemedText>
          </View>
          <View style={styles.indicator}>
            <Feather name="clock" size={14} color={getFrictionColor(frictionLevel)} />
            <ThemedText
              type="caption"
              style={{ color: getFrictionColor(frictionLevel), marginLeft: 4 }}
            >
              {frictionLevel} wait
            </ThemedText>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  content: {},
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  platformInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  platformDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  indicatorsRow: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  indicator: {
    flexDirection: "row",
    alignItems: "center",
  },
});
