import AsyncStorage from "@react-native-async-storage/async-storage";
import type { EarningsLog } from "./ranking-model";
import type { ScoringMode } from "./dual-scorer";
import type { ParsedReceipt } from "./receipt-parser";

export type { EarningsLog };

const EARNINGS_KEY = "@driveradar:earnings";
const SELECTED_ZONE_KEY = "@driveradar:selected_zone";
const USER_PREFS_KEY = "@driveradar:user_prefs";
const PARSED_RECEIPTS_KEY = "@driveradar:parsed_receipts";
const SCORING_MODE_KEY = "@driveradar:scoring_mode";

export interface UserPreferences {
  name: string;
  preferredZones: string[];
  notificationsEnabled: boolean;
  temperature: number;
  scoringMode: ScoringMode;
}

const DEFAULT_PREFS: UserPreferences = {
  name: "Driver",
  preferredZones: [],
  notificationsEnabled: false,
  temperature: 1.0,
  scoringMode: "PILOT",
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
    await AsyncStorage.multiRemove([EARNINGS_KEY, SELECTED_ZONE_KEY, USER_PREFS_KEY, PARSED_RECEIPTS_KEY, SCORING_MODE_KEY]);
  } catch (error) {
    console.error("Failed to clear data:", error);
  }
}

export async function getScoringMode(): Promise<ScoringMode> {
  try {
    const mode = await AsyncStorage.getItem(SCORING_MODE_KEY);
    if (mode === "DEMO") return "PILOT";
    return (mode as ScoringMode) || "PILOT";
  } catch {
    return "PILOT";
  }
}

export async function setScoringMode(mode: ScoringMode): Promise<void> {
  try {
    await AsyncStorage.setItem(SCORING_MODE_KEY, mode);
  } catch (error) {
    console.error("Failed to save scoring mode:", error);
  }
}

export async function getParsedReceipts(): Promise<ParsedReceipt[]> {
  try {
    const data = await AsyncStorage.getItem(PARSED_RECEIPTS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch {
    return [];
  }
}

export async function saveParsedReceipt(receipt: ParsedReceipt): Promise<void> {
  try {
    const receipts = await getParsedReceipts();
    receipts.unshift(receipt);
    await AsyncStorage.setItem(PARSED_RECEIPTS_KEY, JSON.stringify(receipts));
  } catch (error) {
    console.error("Failed to save parsed receipt:", error);
  }
}

export async function saveParsedReceipts(receipts: ParsedReceipt[]): Promise<void> {
  try {
    const existing = await getParsedReceipts();
    const updated = [...receipts, ...existing];
    await AsyncStorage.setItem(PARSED_RECEIPTS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save parsed receipts:", error);
  }
}

export async function deleteParsedReceipt(id: string): Promise<void> {
  try {
    const receipts = await getParsedReceipts();
    const filtered = receipts.filter((r) => r.id !== id);
    await AsyncStorage.setItem(PARSED_RECEIPTS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to delete parsed receipt:", error);
  }
}

export async function convertReceiptToEarningsLog(
  receipt: ParsedReceipt,
  zoneId: string
): Promise<EarningsLog> {
  const log: EarningsLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    platform: receipt.platform,
    amount: receipt.amount,
    zone: zoneId,
    duration: receipt.duration || 0,
    timestamp: receipt.timestamp,
  };
  
  await saveEarningsLog(log);
  return log;
}

export function generateCSV(logs: EarningsLog[]): string {
  const headers = ["ID", "Platform", "Amount", "Zone", "Duration (min)", "Timestamp", "Date"];
  const rows = logs.map(log => [
    log.id,
    log.platform,
    log.amount.toFixed(2),
    log.zone,
    log.duration ? log.duration.toString() : "",
    log.timestamp.toString(),
    new Date(log.timestamp).toISOString(),
  ]);
  
  return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
}
