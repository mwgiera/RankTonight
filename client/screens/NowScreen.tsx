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
  const dateStr = now.toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const zone = getZoneById(selectedZoneId);

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
          <View style={styles.dateRow}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {dateStr} - {timeStr}
            </ThemedText>
          </View>

          <Pressable
            style={[styles.zonePicker, { backgroundColor: theme.backgroundDefault }]}
            onPress={() => setShowZonePicker(!showZonePicker)}
          >
            <View style={styles.zonePickerContent}>
              <Feather name="map-pin" size={16} color={Colors.dark.primary} />
              <ThemedText type="body" style={{ marginLeft: Spacing.sm }}>
                {zone?.name || "Select Zone"}
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
              {ZONES.map((z) => (
                <Pressable
                  key={z.id}
                  style={[
                    styles.zoneOption,
                    z.id === selectedZoneId && { backgroundColor: theme.backgroundSecondary },
                  ]}
                  onPress={() => handleZoneSelect(z.id)}
                >
                  <ThemedText
                    type="body"
                    style={{
                      color: z.id === selectedZoneId ? Colors.dark.primary : theme.text,
                    }}
                  >
                    {z.name}
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    {z.category}
                  </ThemedText>
                </Pressable>
              ))}
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
  dateRow: {
    marginBottom: Spacing.md,
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
  recommendationCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
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
