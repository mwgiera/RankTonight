import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { getApiUrl } from "@/lib/query-client";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "AdminDashboard">;

const ADMIN_TOKEN_KEY = "@driveradar:admin_token";

interface VisitorLocation {
  id: string;
  visitorId: string;
  latitude: number;
  longitude: number;
  zone: string | null;
  createdAt: string;
}

interface Stats {
  totalLocations: number;
  uniqueVisitors: number;
  zoneStats: Record<string, number>;
}

export default function AdminDashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const [locations, setLocations] = useState<VisitorLocation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(ADMIN_TOKEN_KEY);
      if (!token) {
        navigation.replace("AdminLogin");
        return;
      }

      const apiUrl = getApiUrl();
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const [locResponse, statsResponse] = await Promise.all([
        fetch(new URL("/api/admin/locations", apiUrl).toString(), { headers }),
        fetch(new URL("/api/admin/stats", apiUrl).toString(), { headers }),
      ]);

      if (locResponse.status === 401 || statsResponse.status === 401) {
        await AsyncStorage.removeItem(ADMIN_TOKEN_KEY);
        navigation.replace("AdminLogin");
        return;
      }

      const locData = await locResponse.json();
      const statsData = await statsResponse.json();

      setLocations(locData.locations || []);
      setStats(statsData);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [navigation]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem(ADMIN_TOKEN_KEY);
    navigation.replace("AdminLogin");
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.md, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} />
        }
      >
        {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
            <Feather name="users" size={24} color={theme.primary} />
            <Text style={[styles.statValue, { color: theme.text }]}>{stats?.uniqueVisitors || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Active Visitors</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
            <Feather name="map-pin" size={24} color={theme.success} />
            <Text style={[styles.statValue, { color: theme.text }]}>{stats?.totalLocations || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Locations (24h)</Text>
          </View>
        </View>

        {stats?.zoneStats && Object.keys(stats.zoneStats).length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Zone Distribution</Text>
            <View style={styles.zoneGrid}>
              {Object.entries(stats.zoneStats).map(([zone, count]) => (
                <View key={zone} style={[styles.zoneItem, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
                  <Text style={[styles.zoneName, { color: theme.text }]}>{zone}</Text>
                  <Text style={[styles.zoneCount, { color: theme.primary }]}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Locations</Text>
          {locations.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No location data yet</Text>
          ) : (
            locations.slice(0, 20).map((loc) => (
              <View key={loc.id} style={[styles.locationItem, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
                <View style={styles.locationInfo}>
                  <Text style={[styles.visitorId, { color: theme.text }]}>{loc.visitorId.slice(0, 12)}...</Text>
                  <Text style={[styles.locationCoords, { color: theme.textSecondary }]}>
                    {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                  </Text>
                </View>
                <View style={styles.locationMeta}>
                  {loc.zone ? <Text style={[styles.locationZone, { color: theme.primary }]}>{loc.zone}</Text> : null}
                  <Text style={[styles.locationTime, { color: theme.textSecondary }]}>{formatTime(loc.createdAt)}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Feather name="log-out" size={18} color={theme.danger} />
          <Text style={[styles.logoutText, { color: theme.danger }]}>Logout</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  error: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    borderWidth: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  zoneGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  zoneItem: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: 1,
  },
  zoneName: {
    fontSize: 14,
    textTransform: "capitalize",
  },
  zoneCount: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    paddingVertical: Spacing.xl,
  },
  locationItem: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
  },
  locationInfo: {
    flex: 1,
  },
  visitorId: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  locationCoords: {
    fontSize: 12,
    marginTop: 2,
  },
  locationMeta: {
    alignItems: "flex-end",
  },
  locationZone: {
    fontSize: 12,
    textTransform: "capitalize",
  },
  locationTime: {
    fontSize: 12,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.lg,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
