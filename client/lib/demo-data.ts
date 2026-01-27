import type { Platform, ZoneCategory, TimeRegime, DayMode } from "./ranking-model";

export interface DemoEarningsRecord {
  platform: Platform;
  zoneCategory: ZoneCategory;
  dayMode: DayMode;
  timeRegime: TimeRegime;
  avgRevPerHour: number;
  avgTripAmount: number;
  avgTripDuration: number;
  tripCount: number;
  congestionFactor: number;
}

const KRAKOW_EARNINGS_BENCHMARKS = {
  uber: {
    hourlyGross: { min: 55, max: 62 },
    commission: 0.3075,
    tripsPerHour: 1.75,
    avgTripDuration: 18,
  },
  bolt: {
    hourlyGross: { min: 40, max: 50 },
    commission: 0.25,
    tripsPerHour: 1.5,
    avgTripDuration: 20,
  },
  freenow: {
    hourlyGross: { min: 42, max: 52 },
    commission: 0.20,
    tripsPerHour: 1.4,
    avgTripDuration: 22,
  },
};

const TIME_MULTIPLIERS: Record<TimeRegime, Record<ZoneCategory, number>> = {
  "early-morning": { airport: 1.4, center: 0.7, residential: 0.8 },
  "morning-rush": { airport: 1.6, center: 1.4, residential: 1.3 },
  "midday": { airport: 1.1, center: 1.0, residential: 0.9 },
  "afternoon": { airport: 1.2, center: 1.1, residential: 1.0 },
  "evening-rush": { airport: 1.3, center: 1.5, residential: 1.2 },
  "late-night": { airport: 0.7, center: 1.6, residential: 0.6 },
  "overnight": { airport: 0.5, center: 1.2, residential: 0.4 },
};

const WEEKEND_MULTIPLIERS: Record<ZoneCategory, number> = {
  airport: 0.9,
  center: 1.3,
  residential: 1.0,
};

const PLATFORM_ZONE_AFFINITY: Record<Platform, Record<ZoneCategory, number>> = {
  uber: { airport: 1.2, center: 1.0, residential: 0.9 },
  bolt: { airport: 0.9, center: 1.1, residential: 1.1 },
  freenow: { airport: 0.8, center: 1.2, residential: 1.0 },
};

const CONGESTION_BY_TIME: Record<TimeRegime, Record<ZoneCategory, number>> = {
  "early-morning": { airport: 0.3, center: 0.2, residential: 0.2 },
  "morning-rush": { airport: 0.7, center: 0.8, residential: 0.5 },
  "midday": { airport: 0.4, center: 0.5, residential: 0.3 },
  "afternoon": { airport: 0.5, center: 0.5, residential: 0.4 },
  "evening-rush": { airport: 0.6, center: 0.9, residential: 0.5 },
  "late-night": { airport: 0.2, center: 0.4, residential: 0.2 },
  "overnight": { airport: 0.1, center: 0.2, residential: 0.1 },
};

function randomVariation(base: number, variance: number = 0.15): number {
  const mult = 1 + (Math.random() - 0.5) * 2 * variance;
  return Math.round(base * mult * 100) / 100;
}

export function generateDemoDataset(): DemoEarningsRecord[] {
  const records: DemoEarningsRecord[] = [];
  const platforms: Platform[] = ["uber", "bolt", "freenow"];
  const zones: ZoneCategory[] = ["airport", "center", "residential"];
  const dayModes: DayMode[] = ["WEEKDAY", "WEEKEND"];
  const timeRegimes: TimeRegime[] = [
    "early-morning", "morning-rush", "midday", "afternoon",
    "evening-rush", "late-night", "overnight"
  ];

  for (const platform of platforms) {
    const bench = KRAKOW_EARNINGS_BENCHMARKS[platform];
    const baseHourly = (bench.hourlyGross.min + bench.hourlyGross.max) / 2;
    const netHourly = baseHourly * (1 - bench.commission);

    for (const zone of zones) {
      for (const dayMode of dayModes) {
        for (const timeRegime of timeRegimes) {
          const timeMultiplier = TIME_MULTIPLIERS[timeRegime][zone];
          const weekendMult = dayMode === "WEEKEND" ? WEEKEND_MULTIPLIERS[zone] : 1.0;
          const affinityMult = PLATFORM_ZONE_AFFINITY[platform][zone];
          const congestion = CONGESTION_BY_TIME[timeRegime][zone];

          const adjustedHourly = netHourly * timeMultiplier * weekendMult * affinityMult;
          const tripsPerHour = bench.tripsPerHour * timeMultiplier * weekendMult;
          const avgTripAmount = adjustedHourly / Math.max(tripsPerHour, 0.5);

          records.push({
            platform,
            zoneCategory: zone,
            dayMode,
            timeRegime,
            avgRevPerHour: randomVariation(adjustedHourly, 0.1),
            avgTripAmount: randomVariation(avgTripAmount, 0.15),
            avgTripDuration: randomVariation(bench.avgTripDuration, 0.2),
            tripCount: Math.floor(Math.random() * 50) + 10,
            congestionFactor: congestion,
          });
        }
      }
    }
  }

  return records;
}

export function getDemoRecordForContext(
  data: DemoEarningsRecord[],
  platform: Platform,
  zone: ZoneCategory,
  dayMode: DayMode,
  timeRegime: TimeRegime
): DemoEarningsRecord | undefined {
  return data.find(
    r =>
      r.platform === platform &&
      r.zoneCategory === zone &&
      r.dayMode === dayMode &&
      r.timeRegime === timeRegime
  );
}

export function calculateDemoOpportunityScore(
  record: DemoEarningsRecord | undefined,
  congestionWeight: number = 0.3
): number {
  if (!record) return 0;
  
  const revScore = record.avgRevPerHour / 50;
  const congestionPenalty = record.congestionFactor * congestionWeight;
  
  return Math.max(0, Math.min(1, revScore - congestionPenalty));
}

let cachedDemoData: DemoEarningsRecord[] | null = null;

export function getDemoData(): DemoEarningsRecord[] {
  if (!cachedDemoData) {
    cachedDemoData = generateDemoDataset();
  }
  return cachedDemoData;
}

export function regenerateDemoData(): DemoEarningsRecord[] {
  cachedDemoData = generateDemoDataset();
  return cachedDemoData;
}
