import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/lib/language-context";
import { getAllZoneNames, getZoneName } from "@/lib/zones";
import { saveOffer, getActiveSession, recordFeedback } from "@/lib/database";
import { scoreOffer, formatRecommendationForDisplay, type Recommendation, type ScoreComponents } from "@/lib/scorer";
import type { Platform } from "@/lib/ranking-model";

const PLATFORMS: { id: Platform; label: string; color: string }[] = [
  { id: "uber", label: "Uber", color: "#000000" },
  { id: "bolt", label: "Bolt", color: "#34D186" },
  { id: "freenow", label: "FreeNow", color: "#E31E5A" },
];

export default function OffersScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const zones = getAllZoneNames();

  const [platform, setPlatform] = useState<Platform>("uber");
  const [pickupZone, setPickupZone] = useState<string>(zones[0]?.id ?? "stare-miasto");
  const [destZone, setDestZone] = useState<string>("");
  const [fare, setFare] = useState<string>("");
  const [etaMinutes, setEtaMinutes] = useState<string>("");
  const [distanceKm, setDistanceKm] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    recommendation: Recommendation;
    scoreComponents: ScoreComponents;
  } | null>(null);
  const [showZonePicker, setShowZonePicker] = useState<"pickup" | "dest" | null>(null);
  const [lastOfferId, setLastOfferId] = useState<number | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const isFormValid = destZone && fare && etaMinutes && parseFloat(fare) > 0 && parseFloat(etaMinutes) > 0;

  const handleSubmit = useCallback(async () => {
    if (!isFormValid) return;

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const offerInput = {
        platform,
        pickupZone,
        destZone,
        fare: parseFloat(fare),
        etaMinutes: parseFloat(etaMinutes),
        distanceKm: distanceKm ? parseFloat(distanceKm) : undefined,
      };

      const { recommendation, scoreComponents } = await scoreOffer(offerInput);
      
      const session = await getActiveSession();
      const savedOffer = await saveOffer(
        {
          ...offerInput,
          recommendation: {
            action: recommendation.action,
            confidence: recommendation.confidence,
            scoreComponents: scoreComponents as unknown as Record<string, number>,
          },
        },
        session?.id
      );

      setLastOfferId(savedOffer.id);
      setFeedbackGiven(false);
      setResult({ recommendation, scoreComponents });
      Haptics.notificationAsync(
        recommendation.action === "TAKE" || recommendation.action === "COLLECT"
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning
      );
    } catch (error) {
      console.error("Failed to score offer:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isFormValid, platform, pickupZone, destZone, fare, etaMinutes, distanceKm]);

  const resetForm = useCallback(() => {
    setDestZone("");
    setFare("");
    setEtaMinutes("");
    setDistanceKm("");
    setResult(null);
    setLastOfferId(null);
    setFeedbackGiven(false);
  }, []);

  const handleFeedback = useCallback(async (feedback: "FOLLOWED" | "IGNORED") => {
    if (!lastOfferId) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await recordFeedback(lastOfferId, feedback);
      setFeedbackGiven(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Failed to record feedback:", error);
    }
  }, [lastOfferId]);

  const renderZonePicker = () => {
    if (!showZonePicker) return null;

    return (
      <View style={[styles.zonePicker, { backgroundColor: theme.backgroundSecondary }]}>
        <View style={styles.zonePickerHeader}>
          <ThemedText type="h3">
            {showZonePicker === "pickup" ? "Pickup Zone" : "Destination Zone"}
          </ThemedText>
          <Pressable onPress={() => setShowZonePicker(null)}>
            <Feather name="x" size={24} color={theme.text} />
          </Pressable>
        </View>
        <ScrollView style={styles.zoneList}>
          {zones.map((z) => (
            <Pressable
              key={z.id}
              style={[
                styles.zoneOption,
                (showZonePicker === "pickup" ? pickupZone : destZone) === z.id && {
                  backgroundColor: Colors.dark.primary + "30",
                },
              ]}
              onPress={() => {
                if (showZonePicker === "pickup") {
                  setPickupZone(z.id);
                } else {
                  setDestZone(z.id);
                }
                setShowZonePicker(null);
                Haptics.selectionAsync();
              }}
            >
              <ThemedText>{z.name}</ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderResult = () => {
    if (!result) return null;

    const display = formatRecommendationForDisplay(result.recommendation);
    const isPositive = result.recommendation.action === "TAKE";
    const isCollect = result.recommendation.mode === "COLLECT";

    return (
      <Animated.View
        entering={FadeInUp.duration(300)}
        style={[
          styles.resultCard,
          {
            backgroundColor: isCollect
              ? theme.backgroundSecondary
              : isPositive
              ? Colors.dark.success + "20"
              : Colors.dark.danger + "20",
            borderColor: isCollect
              ? theme.border
              : isPositive
              ? Colors.dark.success
              : Colors.dark.danger,
          },
        ]}
      >
        <View style={styles.resultHeader}>
          <ThemedText
            type="hero"
            style={{
              color: isCollect
                ? Colors.dark.warning
                : isPositive
                ? Colors.dark.success
                : Colors.dark.danger,
            }}
          >
            {display.primaryAction}
          </ThemedText>
          <View
            style={[
              styles.confidenceBadge,
              {
                backgroundColor: isCollect
                  ? Colors.dark.warning + "30"
                  : result.recommendation.confidence === "STRONG"
                  ? Colors.dark.success + "30"
                  : Colors.dark.primary + "30",
              },
            ]}
          >
            <ThemedText type="small">{display.confidenceLabel}</ThemedText>
          </View>
        </View>

        <ThemedText style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
          {display.secondaryText}
        </ThemedText>

        {result.recommendation.mode === "PICK" && (
          <View style={styles.scoreBreakdown}>
            <View style={styles.scoreRow}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Expected Hourly
              </ThemedText>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {Math.round(result.scoreComponents.effectiveHourly)} PLN/h
              </ThemedText>
            </View>
            <View style={styles.scoreRow}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Est. Costs
              </ThemedText>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {Math.round(result.scoreComponents.estCosts)} PLN
              </ThemedText>
            </View>
            <View style={styles.scoreRow}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Net Fare
              </ThemedText>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {Math.round(result.scoreComponents.netFare)} PLN
              </ThemedText>
            </View>
          </View>
        )}

        {!feedbackGiven && result.recommendation.mode !== "COLLECT" ? (
          <View style={styles.feedbackSection}>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
              Did you follow this advice?
            </ThemedText>
            <View style={styles.feedbackRow}>
              <Pressable
                style={[styles.feedbackButton, { backgroundColor: Colors.dark.success + "20", borderColor: Colors.dark.success }]}
                onPress={() => handleFeedback("FOLLOWED")}
                testID="button-feedback-followed"
              >
                <Feather name="check" size={20} color={Colors.dark.success} />
                <ThemedText style={{ color: Colors.dark.success, marginLeft: Spacing.xs, fontWeight: "600" }}>
                  Yes
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.feedbackButton, { backgroundColor: Colors.dark.danger + "20", borderColor: Colors.dark.danger }]}
                onPress={() => handleFeedback("IGNORED")}
                testID="button-feedback-ignored"
              >
                <Feather name="x" size={20} color={Colors.dark.danger} />
                <ThemedText style={{ color: Colors.dark.danger, marginLeft: Spacing.xs, fontWeight: "600" }}>
                  No
                </ThemedText>
              </Pressable>
            </View>
          </View>
        ) : feedbackGiven ? (
          <View style={[styles.feedbackConfirm, { backgroundColor: Colors.dark.success + "20" }]}>
            <Feather name="check-circle" size={16} color={Colors.dark.success} />
            <ThemedText style={{ color: Colors.dark.success, marginLeft: Spacing.sm }}>
              Thanks for your feedback!
            </ThemedText>
          </View>
        ) : null}

        <Pressable
          style={[styles.resetButton, { borderColor: theme.border }]}
          onPress={resetForm}
        >
          <ThemedText>Log Another Offer</ThemedText>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {result ? (
          renderResult()
        ) : (
          <Animated.View entering={FadeInDown.duration(300)}>
            <ThemedText type="h2" style={{ marginBottom: Spacing.lg }}>
              Log Offer
            </ThemedText>

            <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
              Platform
            </ThemedText>
            <View style={styles.platformRow}>
              {PLATFORMS.map((p) => (
                <Pressable
                  key={p.id}
                  style={[
                    styles.platformButton,
                    {
                      backgroundColor: platform === p.id ? p.color : theme.backgroundSecondary,
                      borderColor: platform === p.id ? p.color : theme.border,
                    },
                  ]}
                  onPress={() => {
                    setPlatform(p.id);
                    Haptics.selectionAsync();
                  }}
                >
                  <ThemedText
                    type="body"
                    style={{
                      fontWeight: "600",
                      color: platform === p.id ? (p.id === "uber" ? "#fff" : "#000") : theme.text,
                    }}
                  >
                    {p.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.lg }}>
              Pickup Zone
            </ThemedText>
            <Pressable
              style={[styles.zoneSelector, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
              onPress={() => setShowZonePicker("pickup")}
            >
              <ThemedText>{getZoneName(pickupZone)}</ThemedText>
              <Feather name="chevron-down" size={20} color={theme.textSecondary} />
            </Pressable>

            <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md }}>
              Destination Zone *
            </ThemedText>
            <Pressable
              style={[
                styles.zoneSelector,
                {
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: destZone ? theme.border : Colors.dark.warning,
                },
              ]}
              onPress={() => setShowZonePicker("dest")}
            >
              <ThemedText style={{ color: destZone ? theme.text : theme.textSecondary }}>
                {destZone ? getZoneName(destZone) : "Select destination"}
              </ThemedText>
              <Feather name="chevron-down" size={20} color={theme.textSecondary} />
            </Pressable>

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                  Fare (PLN) *
                </ThemedText>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
                  value={fare}
                  onChangeText={setFare}
                  placeholder="0"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="decimal-pad"
                  testID="input-fare"
                />
              </View>
              <View style={styles.inputHalf}>
                <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                  ETA (min) *
                </ThemedText>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
                  value={etaMinutes}
                  onChangeText={setEtaMinutes}
                  placeholder="0"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="decimal-pad"
                  testID="input-eta"
                />
              </View>
            </View>

            <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md }}>
              Distance (km) - optional
            </ThemedText>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
              value={distanceKm}
              onChangeText={setDistanceKm}
              placeholder="Auto-estimated if empty"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              testID="input-distance"
            />

            <Pressable
              style={[
                styles.submitButton,
                {
                  backgroundColor: isFormValid ? Colors.dark.primary : theme.backgroundSecondary,
                  opacity: isFormValid ? 1 : 0.5,
                },
              ]}
              onPress={handleSubmit}
              disabled={!isFormValid || isLoading}
              testID="button-submit-offer"
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText type="body" style={{ fontWeight: "600", color: isFormValid ? "#000" : theme.textSecondary }}>
                  GET RECOMMENDATION
                </ThemedText>
              )}
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>

      {showZonePicker ? renderZonePicker() : null}
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
  platformRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  platformButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    borderWidth: 1,
  },
  zoneSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  inputRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  inputHalf: {
    flex: 1,
  },
  textInput: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: Typography.body.fontSize,
  },
  submitButton: {
    marginTop: Spacing["2xl"],
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  zonePicker: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  zonePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  zoneList: {
    flex: 1,
  },
  zoneOption: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  resultCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  confidenceBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  scoreBreakdown: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  resetButton: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  feedbackSection: {
    marginTop: Spacing.xl,
  },
  feedbackRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  feedbackButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  feedbackConfirm: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
  },
});
