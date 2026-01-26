import AsyncStorage from "@react-native-async-storage/async-storage";
import type { EarningsLog } from "./ranking-model";

const EARNINGS_KEY = "@driveradar:earnings";
const SELECTED_ZONE_KEY = "@driveradar:selected_zone";
const USER_PREFS_KEY = "@driveradar:user_prefs";

export interface UserPreferences {
  name: string;
  preferredZones: string[];
  notificationsEnabled: boolean;
  temperature: number;
}

const DEFAULT_PREFS: UserPreferences = {
  name: "Driver",
  preferredZones: [],
  notificationsEnabled: false,
  temperature: 1.0,
};

export async function getEarningsLogs(): Promise<EarningsLog[]> {
  try {
    const data = await AsyncStorage.getItem(EARNINGS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch {
    return [];
  }
}

export async function saveEarningsLog(log: EarningsLog): Promise<void> {
  try {
    const logs = await getEarningsLogs();
    logs.unshift(log);
    await AsyncStorage.setItem(EARNINGS_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error("Failed to save earnings log:", error);
  }
}

export async function deleteEarningsLog(id: string): Promise<void> {
  try {
    const logs = await getEarningsLogs();
    const filtered = logs.filter((log) => log.id !== id);
    await AsyncStorage.setItem(EARNINGS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to delete earnings log:", error);
  }
}

export async function clearAllLogs(): Promise<void> {
  try {
    await AsyncStorage.removeItem(EARNINGS_KEY);
  } catch (error) {
    console.error("Failed to clear logs:", error);
  }
}

export async function getSelectedZone(): Promise<string> {
  try {
    const zone = await AsyncStorage.getItem(SELECTED_ZONE_KEY);
    return zone || "downtown";
  } catch {
    return "downtown";
  }
}

export async function setSelectedZone(zoneId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(SELECTED_ZONE_KEY, zoneId);
  } catch (error) {
    console.error("Failed to save selected zone:", error);
  }
}

export async function getUserPreferences(): Promise<UserPreferences> {
  try {
    const data = await AsyncStorage.getItem(USER_PREFS_KEY);
    if (data) {
      return { ...DEFAULT_PREFS, ...JSON.parse(data) };
    }
    return DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function saveUserPreferences(prefs: Partial<UserPreferences>): Promise<void> {
  try {
    const current = await getUserPreferences();
    const updated = { ...current, ...prefs };
    await AsyncStorage.setItem(USER_PREFS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save preferences:", error);
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([EARNINGS_KEY, SELECTED_ZONE_KEY, USER_PREFS_KEY]);
  } catch (error) {
    console.error("Failed to clear data:", error);
  }
}
