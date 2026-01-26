import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, FlatList, RefreshControl, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { EarningsLogItem } from "@/components/EarningsLogItem";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Colors } from "@/constants/theme";
import { getEarningsLogs, deleteEarningsLog, type EarningsLog } from "@/lib/storage";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useLanguage } from "@/lib/language-context";

export default function LogScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useLanguage();

  const [logs, setLogs] = useState<EarningsLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadLogs();
    }, [])
  );

  const loadLogs = async () => {
    const data = await getEarningsLogs();
    setLogs(data);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadLogs();
    setRefreshing(false);
  }, []);

  const handleDelete = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await deleteEarningsLog(id);
    await loadLogs();
  };

  const handleAddLog = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("LogEarnings");
  };

  const totalEarnings = logs.reduce((sum, log) => sum + log.amount, 0);
  const totalHours = logs.reduce((sum, log) => sum + log.duration, 0);
  const avgHourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0;

  const renderItem = ({ item, index }: { item: EarningsLog; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <EarningsLogItem log={item} onDelete={() => handleDelete(item.id)} />
    </Animated.View>
  );

  const renderEmpty = () => (
    <Animated.View
      entering={FadeInDown.delay(0).duration(400)}
      style={styles.emptyContainer}
    >
      <Image
        source={require("../../assets/images/empty-logs.png")}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <ThemedText type="h3" style={{ textAlign: "center", marginTop: Spacing.lg }}>
        {t.log.noLogs}
      </ThemedText>
      <ThemedText
        type="body"
        style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.sm }}
      >
        {t.log.noLogsDesc}
      </ThemedText>
      <Button onPress={handleAddLog} style={styles.emptyButton}>
        {t.log.logFirstRide}
      </Button>
    </Animated.View>
  );

  const renderHeader = () =>
    logs.length > 0 ? (
      <Animated.View entering={FadeInDown.delay(0).duration(300)}>
        <View style={[styles.statsCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.statItem}>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {t.log.totalEarnings}
            </ThemedText>
            <ThemedText type="h2" style={{ color: Colors.dark.success }}>
              ${totalEarnings.toFixed(2)}
            </ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {t.log.hoursLogged}
            </ThemedText>
            <ThemedText type="h2">{totalHours}h</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {t.log.avgRate}
            </ThemedText>
            <ThemedText type="h2" style={{ color: Colors.dark.primary }}>
              ${avgHourlyRate.toFixed(0)}/h
            </ThemedText>
          </View>
        </View>
        <ThemedText
          type="h2"
          style={{ marginTop: Spacing.lg, marginBottom: Spacing.md }}
        >
          {t.log.recentLogs}
        </ThemedText>
      </Animated.View>
    ) : null;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl + 80,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.dark.primary}
          />
        }
      />

      {logs.length > 0 ? (
        <FloatingActionButton
          icon="plus"
          onPress={handleAddLog}
          bottom={tabBarHeight + Spacing.lg}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsCard: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderRadius: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyImage: {
    width: 150,
    height: 150,
    opacity: 0.8,
  },
  emptyButton: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing["3xl"],
  },
});
