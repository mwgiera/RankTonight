export type Platform = "bolt" | "uber" | "freenow";
export type ZoneCategory = "airport" | "center" | "residential";
export type ConfidenceLevel = "Strong" | "Medium" | "Weak";
export type DayMode = "WEEKDAY" | "WEEKEND";
export type TimeRegime = "morning-rush" | "midday" | "evening-rush" | "late-night" | "overnight";

export interface ContextMode {
  dayMode: DayMode;
  timeRegime: TimeRegime;
  timeRegimeLabel: string;
  dayModeLabel: string;
}

export interface PlatformScore {
  platform: Platform;
  score: number;
  probability: number;
  demandScore: number;
  frictionScore: number;
  incentiveScore: number;
  reliabilityScore: number;
}

export interface RankingResult {
  rankings: PlatformScore[];
  topPlatform: Platform;
  confidence: ConfidenceLevel;
  confidenceValue: number;
  context: ContextMode;
}

export interface Zone {
  id: string;
  name: string;
  category: ZoneCategory;
  behaviorBias: string;
  lat: number;
  lng: number;
  radius: number;
}

export interface EarningsLog {
  id: string;
  platform: Platform;
  amount: number;
  zone: string;
  duration: number;
  timestamp: number;
}

const PLATFORMS: Platform[] = ["bolt", "uber", "freenow"];

const PLATFORM_DISPLAY_NAMES: Record<Platform, string> = {
  bolt: "Bolt",
  uber: "Uber",
  freenow: "FreeNow",
};

const PLATFORM_COLORS: Record<Platform, string> = {
  bolt: "#34D186",
  uber: "#000000",
  freenow: "#E31E5A",
};

export const getPlatformDisplayName = (platform: Platform): string => {
  return PLATFORM_DISPLAY_NAMES[platform];
};

export const getPlatformColor = (platform: Platform): string => {
  return PLATFORM_COLORS[platform];
};

export const getAllPlatforms = (): Platform[] => PLATFORMS;

/**
 * JS Date.getDay(): 0=Sun..6=Sat
 * Weekend = Sat/Sun
 * Weekend-like = Fri >= 20:00
 */
function getDayType(day: number, hour: number): DayMode {
  const weekend = (day === 0 || day === 6);
  const fridayLate = (day === 5 && hour >= 20);
  return (weekend || fridayLate) ? "WEEKEND" : "WEEKDAY";
}

function getTimeRegime(hour: number): TimeRegime {
  if (hour >= 5 && hour < 9) return "morning-rush";
  if (hour >= 9 && hour < 15) return "midday";
  if (hour >= 15 && hour < 19) return "evening-rush";
  if (hour >= 19 || hour < 1) return "late-night";
  return "overnight";
}

function getTimeRegimeLabel(regime: TimeRegime): string {
  const labels: Record<TimeRegime, string> = {
    "morning-rush": "Morning Rush (05-09)",
    "midday": "Midday (09-15)",
    "evening-rush": "Evening Rush (15-19)",
    "late-night": "Late Night (19-01)",
    "overnight": "Overnight (01-05)",
  };
  return labels[regime];
}

export function getContextMode(date: Date = new Date()): ContextMode {
  const day = date.getDay();
  const hour = date.getHours();
  const dayMode = getDayType(day, hour);
  const timeRegime = getTimeRegime(hour);
  
  return {
    dayMode,
    timeRegime,
    dayModeLabel: dayMode === "WEEKEND" ? "Weekend Mode" : "Weekday Mode",
    timeRegimeLabel: getTimeRegimeLabel(timeRegime),
  };
}

type SeasonalityTable = Record<ZoneCategory, Record<DayMode, Record<TimeRegime, number>>>;

const SEASONALITY: SeasonalityTable = {
  airport: {
    WEEKDAY: {
      "morning-rush": 1.7,
      "midday": 1.3,
      "evening-rush": 1.5,
      "late-night": 0.8,
      "overnight": 0.6,
    },
    WEEKEND: {
      "morning-rush": 1.4,
      "midday": 1.4,
      "evening-rush": 1.4,
      "late-night": 0.7,
      "overnight": 0.6,
    },
  },
  center: {
    WEEKDAY: {
      "morning-rush": 1.5,
      "midday": 1.1,
      "evening-rush": 1.7,
      "late-night": 0.6,
      "overnight": 0.5,
    },
    WEEKEND: {
      "morning-rush": 0.9,
      "midday": 1.4,
      "evening-rush": 1.7,
      "late-night": 2.0,
      "overnight": 1.6,
    },
  },
  residential: {
    WEEKDAY: {
      "morning-rush": 1.4,
      "midday": 0.9,
      "evening-rush": 1.3,
      "late-night": 0.5,
      "overnight": 0.4,
    },
    WEEKEND: {
      "morning-rush": 0.9,
      "midday": 1.0,
      "evening-rush": 1.2,
      "late-night": 0.6,
      "overnight": 0.4,
    },
  },
};

const CONGESTION_MULTIPLIERS: Record<ZoneCategory, Record<number, number>> = {
  airport: {
    0: 0.1, 1: 0.1, 2: 0.1, 3: 0.1, 4: 0.2, 5: 0.4, 6: 0.6, 7: 0.8, 8: 0.9, 9: 0.7,
    10: 0.5, 11: 0.4, 12: 0.5, 13: 0.5, 14: 0.5, 15: 0.6, 16: 0.7, 17: 0.8, 18: 0.8, 19: 0.6,
    20: 0.4, 21: 0.3, 22: 0.2, 23: 0.1,
  },
  center: {
    0: 0.1, 1: 0.1, 2: 0.1, 3: 0.1, 4: 0.1, 5: 0.2, 6: 0.4, 7: 0.7, 8: 0.9, 9: 0.8,
    10: 0.6, 11: 0.6, 12: 0.7, 13: 0.7, 14: 0.6, 15: 0.6, 16: 0.7, 17: 0.9, 18: 0.9, 19: 0.7,
    20: 0.5, 21: 0.4, 22: 0.3, 23: 0.2,
  },
  residential: {
    0: 0.1, 1: 0.1, 2: 0.1, 3: 0.1, 4: 0.1, 5: 0.2, 6: 0.3, 7: 0.5, 8: 0.6, 9: 0.4,
    10: 0.3, 11: 0.3, 12: 0.3, 13: 0.3, 14: 0.3, 15: 0.4, 16: 0.5, 17: 0.6, 18: 0.5, 19: 0.4,
    20: 0.3, 21: 0.2, 22: 0.1, 23: 0.1,
  },
};

const DEADHEAD_RISK: Record<ZoneCategory, number> = {
  airport: 0.3,
  center: 0.2,
  residential: 0.6,
};

const weights = {
  w_offer: 0.80,
  w_postDest: 0.20,
  w1: 1.0,
  w2: 0.8,
  w3: 0.5,
  w4: 0.3,
  a1: 0.4,
  a2: 0.3,
  a3: 0.3,
  b1: 0.6,
  b2: 0.4,
};

export const SCORING_DEFAULTS = {
  costPerKm: 0.70,
  targetHourly: 90,
  tolerance: 0.10,
  minHourlyThreshold: 81,
  estKmPerMinute: 0.45,
};

export function getConfidenceFromSampleCount(sampleCount: number): number {
  if (sampleCount < 5) return Math.min(35, sampleCount * 7);
  if (sampleCount <= 15) return 35 + ((sampleCount - 5) / 10) * 30;
  return Math.min(85, 65 + ((sampleCount - 15) / 20) * 20);
}

interface PlatformPriors {
  incentive: Record<Platform, Record<ZoneCategory, number>>;
  reliability: Record<Platform, number>;
}

const platformPriors: PlatformPriors = {
  incentive: {
    bolt: { airport: 0.15, center: 0.35, residential: 0.25 },
    uber: { airport: 0.40, center: 0.20, residential: 0.10 },
    freenow: { airport: 0.10, center: 0.30, residential: 0.40 },
  },
  reliability: {
    bolt: 0.15,
    uber: 0.35,
    freenow: 0.05,
  },
};

function getWeatherMultiplier(): number {
  return 1.0;
}

function getEventMultiplier(): number {
  return 1.0;
}

function calculateDemand(zoneCategory: ZoneCategory, date: Date): number {
  const day = date.getDay();
  const hour = date.getHours();
  
  const dayMode = getDayType(day, hour);
  const timeRegime = getTimeRegime(hour);
  
  const seasonality = SEASONALITY[zoneCategory][dayMode][timeRegime];
  const weather = getWeatherMultiplier();
  const event = getEventMultiplier();
  
  return weights.a1 * event + weights.a2 * weather + weights.a3 * seasonality;
}

function calculateFriction(zoneCategory: ZoneCategory, date: Date): number {
  const hour = date.getHours();
  const congestion = CONGESTION_MULTIPLIERS[zoneCategory][hour];
  const deadheadRisk = DEADHEAD_RISK[zoneCategory];
  
  return weights.b1 * congestion + weights.b2 * deadheadRisk;
}

function calculateIncentive(platform: Platform, zoneCategory: ZoneCategory): number {
  return platformPriors.incentive[platform][zoneCategory];
}

function calculateReliability(platform: Platform): number {
  return platformPriors.reliability[platform];
}

function softmax(scores: number[], temperature: number = 1.0): number[] {
  const maxScore = Math.max(...scores);
  const expScores = scores.map(s => Math.exp((s - maxScore) / temperature));
  const sumExp = expScores.reduce((a, b) => a + b, 0);
  return expScores.map(e => e / sumExp);
}

function getConfidenceLevel(value: number): ConfidenceLevel {
  if (value >= 0.3) return "Strong";
  if (value >= 0.15) return "Medium";
  return "Weak";
}

export function calculateRankings(
  zoneCategory: ZoneCategory,
  date: Date = new Date(),
  temperature: number = 1.0
): RankingResult {
  const demand = calculateDemand(zoneCategory, date);
  const friction = calculateFriction(zoneCategory, date);
  
  const platformScores: PlatformScore[] = PLATFORMS.map(platform => {
    const incentive = calculateIncentive(platform, zoneCategory);
    const reliability = calculateReliability(platform);
    
    const score = weights.w1 * demand - weights.w2 * friction + weights.w3 * incentive + weights.w4 * reliability;
    
    return {
      platform,
      score,
      probability: 0,
      demandScore: demand,
      frictionScore: friction,
      incentiveScore: incentive,
      reliabilityScore: reliability,
    };
  });
  
  const scores = platformScores.map(p => p.score);
  const probabilities = softmax(scores, temperature);
  
  platformScores.forEach((p, i) => {
    p.probability = probabilities[i];
  });
  
  platformScores.sort((a, b) => b.probability - a.probability);
  
  const confidenceValue = platformScores[0].probability - platformScores[1].probability;
  const confidence = getConfidenceLevel(confidenceValue);
  const context = getContextMode(date);
  
  return {
    rankings: platformScores,
    topPlatform: platformScores[0].platform,
    confidence,
    confidenceValue,
    context,
  };
}

export const ZONES: Zone[] = [
  // Center zones (high activity)
  { id: "stare-miasto", name: "Stare Miasto", category: "center", behaviorBias: "daytime bias", lat: 50.0614, lng: 19.9372, radius: 1.5 },
  { id: "kazimierz", name: "Kazimierz", category: "center", behaviorBias: "late-night bias", lat: 50.0508, lng: 19.9447, radius: 1 },
  { id: "grzegorzki", name: "Grzegórzki", category: "center", behaviorBias: "weekday bias", lat: 50.0650, lng: 19.9650, radius: 2 },
  { id: "podgorze", name: "Podgórze", category: "center", behaviorBias: "mixed", lat: 50.0450, lng: 19.9550, radius: 2 },
  { id: "podgorze-duchackie", name: "Podgórze Duchackie", category: "residential", behaviorBias: "commuter hours", lat: 50.0200, lng: 19.9600, radius: 3 },
  // West zones
  { id: "krowodrza", name: "Krowodrza", category: "residential", behaviorBias: "commuter hours", lat: 50.0750, lng: 19.9100, radius: 2.5 },
  { id: "bronowice", name: "Bronowice", category: "residential", behaviorBias: "commuter hours", lat: 50.0850, lng: 19.8900, radius: 2 },
  { id: "zwierzyniec", name: "Zwierzyniec", category: "residential", behaviorBias: "commuter hours", lat: 50.0550, lng: 19.8750, radius: 3 },
  { id: "debniki", name: "Dębniki", category: "residential", behaviorBias: "commuter hours", lat: 50.0400, lng: 19.9100, radius: 2.5 },
  { id: "lagiewniki-borek", name: "Łagiewniki–Borek Fałęcki", category: "residential", behaviorBias: "commuter hours", lat: 50.0150, lng: 19.9300, radius: 2 },
  { id: "ruczaj", name: "Ruczaj", category: "residential", behaviorBias: "commuter hours", lat: 50.0250, lng: 19.8900, radius: 2 },
  // North zones
  { id: "pradnik-bialy", name: "Prądnik Biały", category: "residential", behaviorBias: "commuter hours", lat: 50.1000, lng: 19.9200, radius: 3 },
  { id: "pradnik-czerwony", name: "Prądnik Czerwony", category: "residential", behaviorBias: "commuter hours", lat: 50.1000, lng: 19.9600, radius: 2.5 },
  // East zones (Nowa Huta area)
  { id: "czyzyny", name: "Czyżyny", category: "residential", behaviorBias: "commuter hours", lat: 50.0700, lng: 20.0100, radius: 2.5 },
  { id: "mistrzejowice", name: "Mistrzejowice", category: "residential", behaviorBias: "commuter hours", lat: 50.1050, lng: 20.0100, radius: 2 },
  { id: "bienczyce", name: "Bieńczyce", category: "residential", behaviorBias: "commuter hours", lat: 50.0900, lng: 20.0350, radius: 2 },
  { id: "nowa-huta", name: "Nowa Huta", category: "residential", behaviorBias: "commuter hours", lat: 50.0700, lng: 20.0500, radius: 3 },
  // Airport zone (special)
  { id: "airport-balice", name: "Kraków Airport / Balice", category: "airport", behaviorBias: "transit-heavy", lat: 50.0777, lng: 19.7848, radius: 3 },
];

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function findNearestZone(lat: number, lng: number): Zone {
  let nearestZone = ZONES[1];
  let minDistance = Infinity;
  
  for (const zone of ZONES) {
    const distance = haversineDistance(lat, lng, zone.lat, zone.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearestZone = zone;
    }
  }
  
  return nearestZone;
}

export function getZoneById(id: string): Zone | undefined {
  return ZONES.find(z => z.id === id);
}

export function getDemandLevel(value: number): "High" | "Medium" | "Low" {
  if (value >= 1.2) return "High";
  if (value >= 0.8) return "Medium";
  return "Low";
}

export function getFrictionLevel(value: number): "High" | "Medium" | "Low" {
  if (value >= 0.6) return "High";
  if (value >= 0.3) return "Medium";
  return "Low";
}

type EmaKey = `${Platform}:${string}:${DayMode}:${TimeRegime}`;

interface EmaEntry {
  ema: number;
  count: number;
  lastUpdated: number;
}

type EmaStore = Record<EmaKey, EmaEntry>;

const EMA_STORAGE_KEY = "profitDriver:ema:v1";
const EMA_ALPHA = 0.3;

function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function loadEmaStore(): Promise<EmaStore> {
  const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
  const raw = await AsyncStorage.getItem(EMA_STORAGE_KEY);
  return safeParseJson<EmaStore>(raw, {});
}

async function saveEmaStore(store: EmaStore): Promise<void> {
  const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
  await AsyncStorage.setItem(EMA_STORAGE_KEY, JSON.stringify(store));
}

export async function ingestEarningsLog(log: EarningsLog): Promise<{ ok: boolean; reason?: string }> {
  const minutes = log.duration ?? 0;
  if (minutes <= 0) {
    return { ok: false, reason: "duration missing or zero" };
  }

  const revPerHour = (log.amount / minutes) * 60;
  const date = new Date(log.timestamp);
  const ctx = getContextMode(date);

  const key: EmaKey = `${log.platform}:${log.zone}:${ctx.dayMode}:${ctx.timeRegime}`;

  const store = await loadEmaStore();
  const prev = store[key];

  if (prev) {
    store[key] = {
      ema: EMA_ALPHA * revPerHour + (1 - EMA_ALPHA) * prev.ema,
      count: prev.count + 1,
      lastUpdated: Date.now(),
    };
  } else {
    store[key] = {
      ema: revPerHour,
      count: 1,
      lastUpdated: Date.now(),
    };
  }

  await saveEmaStore(store);
  return { ok: true };
}

export async function getEmaForContext(
  platform: Platform,
  zone: string,
  dayMode: DayMode,
  timeRegime: TimeRegime
): Promise<EmaEntry | null> {
  const store = await loadEmaStore();
  const key: EmaKey = `${platform}:${zone}:${dayMode}:${timeRegime}`;
  return store[key] ?? null;
}
