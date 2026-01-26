import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ZoneCard } from "@/components/ZoneCard";
import { CategoryChip } from "@/components/CategoryChip";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Colors } from "@/constants/theme";
import { ZONES, type Zone, type ZoneCategory } from "@/lib/ranking-model";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type CategoryFilter = "all" | ZoneCategory;

export default function ZonesScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [refreshing, setRefreshing] = useState(false);

  const filteredZones = selectedCategory === "all"
    ? ZONES
    : ZONES.filter((z) => z.category === selectedCategory);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setRefreshing(false);
  }, []);

  const handleCategorySelect = (category: CategoryFilter) => {
    setSelectedCategory(category);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleZonePress = (zone: Zone) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("ZoneDetail", { zoneId: zone.id });
  };

  const categories: { key: CategoryFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "airport", label: "Airport" },
    { key: "center", label: "Center" },
    { key: "residential", label: "Residential" },
  ];

  const renderItem = ({ item, index }: { item: Zone; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <ZoneCard zone={item} onPress={() => handleZonePress(item)} />
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={filteredZones}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ListHeaderComponent={
          <View style={styles.filterContainer}>
            <FlatList
              horizontal
              data={categories}
              keyExtractor={(item) => item.key}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <CategoryChip
                  label={item.label}
                  isSelected={selectedCategory === item.key}
                  onPress={() => handleCategorySelect(item.key)}
                />
              )}
              contentContainerStyle={styles.chipsContainer}
            />
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.dark.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              No zones found
            </ThemedText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    marginBottom: Spacing.lg,
  },
  chipsContainer: {
    paddingVertical: Spacing.sm,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: Spacing["4xl"],
  },
});
