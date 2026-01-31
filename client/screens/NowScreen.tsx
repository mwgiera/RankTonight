import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, RefreshControl, Pressable, Platform as RNPlatform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { MoneyProofCard } from "@/components/MoneyProofCard";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import { ZONES, findNearestZone } from "@/lib/ranking-model";
import { getSelectedZone, setSelectedZone, getUserPreferences } from "@/lib/storage";
import { getMoneyProofCounters, type MoneyProofCounters } from "@/lib/database";
import { getApiUrl } from "@/lib/query-client";
import { getIdleRecommendation, type Recommendation, formatRecommendationForDisplay } from "@/lib/scorer";
import { getBucket } from "@/lib/time-buckets";
import { getZoneById } from "@/lib/zones";
import type { MainTabParamList } from "@/navigation/MainTabNavigator";
import { useLanguage } from "@/lib/language-context";
import { getTimeRegimeLabelTranslated, getDayModeLabelTranslated } from "@/lib/translations";

export default function NowScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { language, t } = useLanguage();

  const [selectedZoneId, setSelectedZoneId] = useState<string | null>("stare-miasto");
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showZonePicker, setShowZonePicker] = useState(false);
  const [dwellMinutes, setDwellMinutes] = useState(0);
  const [moneyProof, setMoneyProof] = useState<MoneyProofCounters | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);

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
    
    const currentPrefs = await getUserPreferences();
    if (!currentPrefs.dataSharingEnabled) return;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationEnabled(status === "granted");
      
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

  const loadData = async () => {
    const zoneId = await getSelectedZone();
    setSelectedZoneId(zoneId);
    
    const rec = await getIdleRecommendation(zoneId, dwellMinutes);
    setRecommendation(rec);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadData();
    await loadMoneyProof();
    setRefreshing(false);
  }, [dwellMinutes]);

  const handleZoneSelect = async (zoneId: string) => {
    setSelectedZoneId(zoneId);
    await setSelectedZone(zoneId);
    setShowZonePicker(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const rec = await getIdleRecommendation(zoneId, dwellMinutes);
    setRecommendation(rec);
  };

  const handleLogOffer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("OffersTab");
  };

  const now = new Date();
  const bucket = getBucket(Date.now());
  const zone = selectedZoneId ? getZoneById(selectedZoneId) : null;

  const getActionColor = (action: string) => {
    switch (action) {
      case "WAIT": return Colors.dark.primary;
      case "MOVE": return Colors.dark.warning;
      case "COLLECT": return Colors.dark.warning;
      case "TAKE": return Colors.dark.success;
      case "DECLINE": return Colors.dark.danger;
      default: return theme.text;
    }
  };

  const getActionIcon = (action: string): keyof typeof Feather.glyphMap => {
    switch (action) {
      case "WAIT": return "clock";
      case "MOVE": return "navigation";
      case "COLLECT": return "database";
      case "TAKE": return "check-circle";
      case "DECLINE": return "x-circle";
      default: return "help-circle";
    }
  };

  const display = recommendation ? formatRecommendationForDisplay(recommendation) : null;

  return (
    <ThemedView style={styles.container}>
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
            <View style={styles.contextBadges}>
              <View style={[styles.contextBadge, bucket.dayType === "weekend" && styles.contextBadgeActive]}>
                <ThemedText type="caption" style={[styles.contextBadgeText, bucket.dayType === "weekend" && styles.contextBadgeTextActive]}>
                  {getDayModeLabelTranslated(bucket.dayType, language)}
                </ThemedText>
              </View>
              <View style={styles.contextDot} />
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                {getTimeRegimeLabelTranslated(bucket.timeRegime, language)}
              </ThemedText>
            </View>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
              {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
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
                return (
                  <Pressable
                    key={z.id}
                    style={[
                      styles.zoneOption,
                      isSelected && { backgroundColor: theme.backgroundSecondary },
                    ]}
                    onPress={() => handleZoneSelect(z.id)}
                  >
                    <ThemedText
                      type="body"
                      style={{
                        color: isSelected ? Colors.dark.primary : theme.text,
                        fontWeight: isSelected ? "600" : "400",
                      }}
                    >
                      {z.name}
                    </ThemedText>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                      {z.behaviorBias}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </Animated.View>

        {recommendation && display ? (
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={[
              styles.recommendationCard,
              { 
                backgroundColor: theme.backgroundDefault, 
                borderColor: getActionColor(recommendation.action),
              },
            ]}
          >
            <View style={styles.actionRow}>
              <View style={[styles.actionIconCircle, { backgroundColor: getActionColor(recommendation.action) + "20" }]}>
                <Feather name={getActionIcon(recommendation.action)} size={32} color={getActionColor(recommendation.action)} />
              </View>
              <View style={styles.actionContent}>
                <ThemedText type="hero" style={{ color: getActionColor(recommendation.action) }}>
                  {display.primaryAction}
                </ThemedText>
                <View style={[
                  styles.confidenceBadge,
                  recommendation.confidence === "STRONG" && { backgroundColor: Colors.dark.success + "30" },
                  recommendation.confidence === "MEDIUM" && { backgroundColor: Colors.dark.warning + "30" },
                  recommendation.confidence === "WEAK" && { backgroundColor: Colors.dark.danger + "30" },
                ]}>
                  <ThemedText type="small" style={{ 
                    color: recommendation.confidence === "STRONG" ? Colors.dark.success 
                         : recommendation.confidence === "MEDIUM" ? Colors.dark.warning 
                         : Colors.dark.danger,
                    fontWeight: "500",
                  }}>
                    {display.confidenceLabel}
                  </ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <ThemedText style={{ color: theme.textSecondary, lineHeight: 22 }}>
              {display.secondaryText}
            </ThemedText>

            {recommendation.mode === "GUIDE" && (
              <View style={styles.guideDetails}>
                <View style={styles.guideRow}>
                  <Feather name="clock" size={16} color={theme.textSecondary} />
                  <ThemedText type="body" style={{ marginLeft: Spacing.sm }}>
                    Wait up to {recommendation.stayUntilMin} min
                  </ThemedText>
                </View>
                <View style={styles.guideRow}>
                  <Feather name="alert-circle" size={16} color={Colors.dark.warning} />
                  <ThemedText type="body" style={{ marginLeft: Spacing.sm, color: Colors.dark.warning }}>
                    Leave after {recommendation.leaveIfMin} min
                  </ThemedText>
                </View>
                {recommendation.suggestedZone ? (
                  <View style={styles.guideRow}>
                    <Feather name="arrow-right" size={16} color={Colors.dark.primary} />
                    <ThemedText type="body" style={{ marginLeft: Spacing.sm, color: Colors.dark.primary }}>
                      Consider: {recommendation.suggestedZone}
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            )}

            {recommendation.mode === "COLLECT" && (
              <View style={[styles.collectPrompt, { backgroundColor: Colors.dark.warning + "15" }]}>
                <Feather name="plus-circle" size={20} color={Colors.dark.warning} />
                <ThemedText style={{ marginLeft: Spacing.sm, flex: 1, color: theme.text }}>
                  Log {recommendation.neededSamples} more trips to unlock personalized advice
                </ThemedText>
              </View>
            )}

            <Pressable
              style={[styles.logOfferButton, { backgroundColor: Colors.dark.primary }]}
              onPress={handleLogOffer}
            >
              <Feather name="plus" size={18} color="#FFF" />
              <ThemedText style={{ color: "#FFF", fontWeight: "600", marginLeft: Spacing.sm }}>
                Got an Offer? Log It
              </ThemedText>
            </Pressable>
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={[styles.loadingCard, { backgroundColor: theme.backgroundDefault }]}
          >
            <ThemedText style={{ color: theme.textSecondary }}>Loading recommendation...</ThemedText>
          </Animated.View>
        )}

        {moneyProof && (moneyProof.baselineCount > 0 || moneyProof.followedCount > 0) ? (
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
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
        onPress={handleLogOffer}
        bottom={tabBarHeight + Spacing.lg}
      />
    </ThemedView>
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
  },
  contextBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  contextBadgeActive: {
    backgroundColor: Colors.dark.primary + "30",
  },
  contextBadgeText: {
    color: "rgba(255,255,255,0.7)",
  },
  contextBadgeTextActive: {
    color: Colors.dark.primary,
  },
  contextDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: Spacing.sm,
  },
  zonePicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  zonePickerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  zoneDropdown: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  zoneOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  recommendationCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    marginTop: Spacing.lg,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
  },
  actionContent: {
    flex: 1,
  },
  confidenceBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: Spacing.lg,
  },
  guideDetails: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  guideRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  collectPrompt: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  logOfferButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
  },
  loadingCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    marginTop: Spacing.lg,
  },
});
