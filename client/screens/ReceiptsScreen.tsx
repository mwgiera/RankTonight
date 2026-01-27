import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  Share,
  Platform as RNPlatform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import { useLanguage } from "@/lib/language-context";
import {
  getParsedReceipts,
  saveParsedReceipt,
  deleteParsedReceipt,
  convertReceiptToEarningsLog,
  getEarningsLogs,
  generateCSV,
  getSelectedZone,
} from "@/lib/storage";
import {
  parseReceipt,
  formatReceiptForDisplay,
  autoDetectPlatform,
  type ParsedReceipt,
} from "@/lib/receipt-parser";
import { getAllPlatforms, getPlatformDisplayName, getPlatformColor, type Platform as RidePlatform } from "@/lib/ranking-model";

export default function ReceiptsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation();

  const [receiptText, setReceiptText] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<RidePlatform>("uber");
  const [parsedReceipts, setParsedReceipts] = useState<ParsedReceipt[]>([]);
  const [lastParsed, setLastParsed] = useState<ParsedReceipt | null>(null);
  const [showPlatformPicker, setShowPlatformPicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadReceipts();
    }, [])
  );

  const loadReceipts = async () => {
    const receipts = await getParsedReceipts();
    setParsedReceipts(receipts);
  };

  const handleParse = async () => {
    if (!receiptText.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const detectedPlatform = autoDetectPlatform(receiptText);
    const platformToUse = detectedPlatform || selectedPlatform;

    const parsed = parseReceipt(receiptText, platformToUse);
    setLastParsed(parsed);

    if (parsed.amount > 0) {
      await saveParsedReceipt(parsed);
      await loadReceipts();
      setReceiptText("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleImportToLog = async (receipt: ParsedReceipt) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const zoneId = await getSelectedZone();
    await convertReceiptToEarningsLog(receipt, zoneId);
    await deleteParsedReceipt(receipt.id);
    await loadReceipts();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleExportCSV = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const logs = await getEarningsLogs();
    const csv = generateCSV(logs);

    if (RNPlatform.OS === "web") {
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `driveradar-export-${Date.now()}.csv`;
      a.click();
    } else {
      await Share.share({
        message: csv,
        title: "DriveRadar Export",
      });
    }
  };

  const handleDeleteReceipt = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await deleteParsedReceipt(id);
    await loadReceipts();
  };

  const renderReceiptItem = ({ item }: { item: ParsedReceipt }) => {
    const display = formatReceiptForDisplay(item);
    const platformColor = getPlatformColor(item.platform);

    return (
      <View style={[styles.receiptCard, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.receiptHeader}>
          <View style={[styles.platformBadge, { backgroundColor: platformColor + "30" }]}>
            <ThemedText type="caption" style={{ color: platformColor, fontWeight: "600" }}>
              {getPlatformDisplayName(item.platform)}
            </ThemedText>
          </View>
          <View style={[
            styles.confidenceBadge,
            item.parseConfidence === "high" && { backgroundColor: Colors.dark.success + "30" },
            item.parseConfidence === "medium" && { backgroundColor: Colors.dark.warning + "30" },
            item.parseConfidence === "low" && { backgroundColor: Colors.dark.danger + "30" },
          ]}>
            <ThemedText type="caption" style={{
              color: item.parseConfidence === "high" ? Colors.dark.success :
                     item.parseConfidence === "medium" ? Colors.dark.warning : Colors.dark.danger,
            }}>
              {item.parseConfidence}
            </ThemedText>
          </View>
        </View>

        <View style={styles.receiptDetails}>
          <View style={styles.detailRow}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {t.receipts.date}
            </ThemedText>
            <ThemedText type="body">{display.date} {display.time}</ThemedText>
          </View>
          <View style={styles.detailRow}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {t.receipts.amount}
            </ThemedText>
            <ThemedText type="h2" style={{ color: Colors.dark.success }}>
              {display.amount}
            </ThemedText>
          </View>
          <View style={styles.detailRow}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {t.receipts.duration}
            </ThemedText>
            <ThemedText type="body" style={!item.duration ? { color: Colors.dark.warning } : {}}>
              {display.duration}
            </ThemedText>
          </View>
          {display.revPerHour ? (
            <View style={styles.detailRow}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {t.receipts.revPerHour}
              </ThemedText>
              <ThemedText type="body" style={{ color: Colors.dark.primary, fontWeight: "600" }}>
                {display.revPerHour}
              </ThemedText>
            </View>
          ) : (
            <View style={styles.detailRow}>
              <ThemedText type="caption" style={{ color: Colors.dark.warning }}>
                {t.receipts.durationMissing} - {t.receipts.perTrip}
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.receiptActions}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: Colors.dark.success + "20" }]}
            onPress={() => handleImportToLog(item)}
          >
            <Feather name="download" size={16} color={Colors.dark.success} />
            <ThemedText type="small" style={{ color: Colors.dark.success, marginLeft: Spacing.xs }}>
              {t.receipts.importToLog}
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.actionButton, { backgroundColor: Colors.dark.danger + "20" }]}
            onPress={() => handleDeleteReceipt(item.id)}
          >
            <Feather name="trash-2" size={16} color={Colors.dark.danger} />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <Animated.View entering={FadeInDown.delay(0).duration(300)}>
          <ThemedText type="h2" style={{ marginBottom: Spacing.md }}>
            {t.receipts.pasteReceipt}
          </ThemedText>

          <View style={[styles.inputCard, { backgroundColor: theme.backgroundDefault }]}>
            <TextInput
              style={[styles.textArea, { color: theme.text }]}
              value={receiptText}
              onChangeText={setReceiptText}
              placeholder={t.receipts.noReceiptText}
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <View style={styles.platformSelector}>
              <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                {t.receipts.selectPlatform}
              </ThemedText>
              <View style={styles.platformOptions}>
                {getAllPlatforms().map((platform: RidePlatform) => (
                  <Pressable
                    key={platform}
                    style={[
                      styles.platformOption,
                      selectedPlatform === platform && {
                        backgroundColor: getPlatformColor(platform) + "30",
                        borderColor: getPlatformColor(platform),
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedPlatform(platform);
                    }}
                  >
                    <ThemedText
                      type="body"
                      style={{
                        color: selectedPlatform === platform ? getPlatformColor(platform) : theme.text,
                        fontWeight: selectedPlatform === platform ? "600" : "400",
                      }}
                    >
                      {getPlatformDisplayName(platform)}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              style={[
                styles.parseButton,
                { backgroundColor: Colors.dark.primary },
                !receiptText.trim() && { opacity: 0.5 },
              ]}
              onPress={handleParse}
              disabled={!receiptText.trim()}
            >
              <Feather name="zap" size={18} color="#FFFFFF" />
              <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600", marginLeft: Spacing.sm }}>
                {t.receipts.parseReceipt}
              </ThemedText>
            </Pressable>
          </View>
        </Animated.View>

        {lastParsed && lastParsed.errors.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
            <View style={[styles.errorCard, { backgroundColor: Colors.dark.danger + "20" }]}>
              <Feather name="alert-circle" size={16} color={Colors.dark.danger} />
              <ThemedText type="small" style={{ color: Colors.dark.danger, marginLeft: Spacing.sm }}>
                {lastParsed.errors.join(", ")}
              </ThemedText>
            </View>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(200).duration(300)}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h2" style={{ marginTop: Spacing["2xl"], marginBottom: Spacing.md }}>
              {t.receipts.parsedReceipts} ({parsedReceipts.length})
            </ThemedText>
            <Pressable
              style={[styles.exportButton, { backgroundColor: theme.backgroundDefault }]}
              onPress={handleExportCSV}
            >
              <Feather name="download" size={16} color={Colors.dark.primary} />
              <ThemedText type="small" style={{ color: Colors.dark.primary, marginLeft: Spacing.xs }}>
                {t.receipts.exportCsv}
              </ThemedText>
            </Pressable>
          </View>

          {parsedReceipts.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}>
              <Feather name="file-text" size={48} color={theme.textSecondary} />
              <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
                {t.receipts.noReceiptText}
              </ThemedText>
            </View>
          ) : (
            parsedReceipts.map((receipt, index) => (
              <Animated.View key={receipt.id} entering={FadeInDown.delay(100 * index).duration(300)}>
                {renderReceiptItem({ item: receipt })}
              </Animated.View>
            ))
          )}
        </Animated.View>
      </KeyboardAwareScrollViewCompat>
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
  inputCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  textArea: {
    minHeight: 120,
    fontSize: 14,
    fontFamily: "monospace",
    padding: Spacing.md,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  platformSelector: {
    marginBottom: Spacing.md,
  },
  platformOptions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  platformOption: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
  },
  parseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  receiptCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  receiptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  platformBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  confidenceBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  receiptDetails: {
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receiptActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  emptyState: {
    alignItems: "center",
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.md,
  },
});
