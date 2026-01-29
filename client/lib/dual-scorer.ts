import type {
  Platform,
  ZoneCategory,
  DayMode,
  TimeRegime,
  ConfidenceLevel,
  RankingResult,
  PlatformScore,
  ContextMode,
  EarningsLog,
} from "./ranking-model";
import { getContextMode, getAllPlatforms, ZONES, calculateRankings, getConfidenceFromSampleCount, SCORING_DEFAULTS } from "./ranking-model";

export type ScoringMode = "PILOT" | "PERSONAL";

export interface PersonalStats {
  platform: Platform;
  zone: string;
  dayMode: DayMode;
  timeRegime: TimeRegime;
  avgRevPerHour: number | null;
  avgEarningsPerTrip: number;
  tripCount: number;
  totalEarnings: number;
  totalDurationMinutes: number;
  hasDurationData: boolean;
}

export interface DualRankingResult extends RankingResult {
  mode: ScoringMode;
  modeLabel: string;
  dataSource: string;
  minRecordsRequired: number;
  currentRecordCount: number;
}

const MIN_RECORDS_FOR_PERSONAL = 5;
const TIME_DECAY_DAYS = 30;

function applyTimeDecay(timestamp: number, now: number = Date.now()): number {
  const daysDiff = (now - timestamp) / (1000 * 60 * 60 * 24);
  return Math.exp(-daysDiff / TIME_DECAY_DAYS);
}

function getTimeRegimeFromHour(hour: number): TimeRegime {
  if (hour >= 5 && hour < 9) return "morning-rush";
  if (hour >= 9 && hour < 15) return "midday";
  if (hour >= 15 && hour < 19) return "evening-rush";
  if (hour >= 19 || hour < 1) return "late-night";
  return "overnight";
}

function getDayModeFromDate(date: Date): DayMode {
  const day = date.getDay();
  const hour = date.getHours();
  const weekend = day === 0 || day === 6;
  const fridayLate = day === 5 && hour >= 20;
  return weekend || fridayLate ? "WEEKEND" : "WEEKDAY";
}

export function calculatePersonalStats(
  logs: EarningsLog[],
  zoneId: string,
  dayMode: DayMode,
  timeRegime: TimeRegime
): PersonalStats[] {
  const platforms = getAllPlatforms();
  const now = Date.now();
  
  return platforms.map(platform => {
    const relevantLogs = logs.filter(log => {
      if (log.platform !== platform) return false;
      if (log.zone !== zoneId) return false;
      
      const logDate = new Date(log.timestamp);
      const logDayMode = getDayModeFromDate(logDate);
      const logTimeRegime = getTimeRegimeFromHour(logDate.getHours());
      
      return logDayMode === dayMode && logTimeRegime === timeRegime;
    });
    
    if (relevantLogs.length === 0) {
      return {
        platform,
        zone: zoneId,
        dayMode,
        timeRegime,
        avgRevPerHour: null,
        avgEarningsPerTrip: 0,
        tripCount: 0,
        totalEarnings: 0,
        totalDurationMinutes: 0,
        hasDurationData: false,
      };
    }
    
    let weightedEarnings = 0;
    let weightedDuration = 0;
    let totalWeight = 0;
    let tripsWithDuration = 0;
    
    for (const log of relevantLogs) {
      const weight = applyTimeDecay(log.timestamp, now);
      weightedEarnings += log.amount * weight;
      totalWeight += weight;
      
      if (log.duration && log.duration > 0) {
        weightedDuration += log.duration * weight;
        tripsWithDuration++;
      }
    }
    
    const avgEarningsPerTrip = totalWeight > 0 ? weightedEarnings / totalWeight : 0;
    const hasDurationData = tripsWithDuration > relevantLogs.length * 0.5;
    
    let avgRevPerHour: number | null = null;
    if (hasDurationData && weightedDuration > 0) {
      const avgDurationMinutes = weightedDuration / tripsWithDuration;
      avgRevPerHour = (avgEarningsPerTrip / avgDurationMinutes) * 60;
    }
    
    return {
      platform,
      zone: zoneId,
      dayMode,
      timeRegime,
      avgRevPerHour,
      avgEarningsPerTrip,
      tripCount: relevantLogs.length,
      totalEarnings: relevantLogs.reduce((sum, l) => sum + l.amount, 0),
      totalDurationMinutes: relevantLogs.reduce((sum, l) => sum + (l.duration || 0), 0),
      hasDurationData,
    };
  });
}

export function scoreDemo(
  zoneCategory: ZoneCategory,
  date: Date = new Date()
): DualRankingResult {
  const baseRanking = calculateRankings(zoneCategory, date);
  
  return {
    rankings: baseRanking.rankings,
    topPlatform: baseRanking.topPlatform,
    confidence: baseRanking.confidence,
    confidenceValue: baseRanking.confidenceValue,
    context: baseRanking.context,
    mode: "PILOT",
    modeLabel: "Pilot mode using market benchmarks. Log earnings to unlock Personal mode.",
    dataSource: "Krakow market benchmarks",
    minRecordsRequired: MIN_RECORDS_FOR_PERSONAL,
    currentRecordCount: 0,
  };
}

export function scorePersonal(
  logs: EarningsLog[],
  zoneId: string,
  date: Date = new Date()
): DualRankingResult | null {
  const context = getContextMode(date);
  const zone = ZONES.find(z => z.id === zoneId);
  
  if (!zone) return null;
  
  const stats = calculatePersonalStats(logs, zoneId, context.dayMode, context.timeRegime);
  const totalRecords = stats.reduce((sum, s) => sum + s.tripCount, 0);
  
  if (totalRecords < MIN_RECORDS_FOR_PERSONAL) {
    return null;
  }
  
  const hasAnyDurationData = stats.some(s => s.hasDurationData);
  
  const platformScores: PlatformScore[] = stats.map(stat => {
    let score: number;
    
    if (hasAnyDurationData && stat.avgRevPerHour !== null) {
      score = stat.avgRevPerHour / 50;
    } else {
      score = stat.avgEarningsPerTrip / 30;
    }
    
    const confidenceBoost = Math.min(stat.tripCount / 20, 0.2);
    score += confidenceBoost;
    
    return {
      platform: stat.platform,
      score: Math.max(0, score),
      probability: 0,
      demandScore: stat.avgEarningsPerTrip / 30,
      frictionScore: 0.3,
      incentiveScore: 0.1,
      reliabilityScore: stat.tripCount / 50,
    };
  });
  
  const sumScores = platformScores.reduce((sum, p) => sum + p.score, 0) || 1;
  platformScores.forEach(p => {
    p.probability = p.score / sumScores;
  });
  
  platformScores.sort((a, b) => b.score - a.score);
  
  const confidenceValue = platformScores[0].probability - (platformScores[1]?.probability || 0);
  const confidence = getConfidenceLevel(confidenceValue);
  
  const dataSource = hasAnyDurationData
    ? "Your earnings history (PLN/hour)"
    : "Your earnings history (per trip, duration missing)";
  
  return {
    rankings: platformScores,
    topPlatform: platformScores[0].platform,
    confidence,
    confidenceValue,
    context,
    mode: "PERSONAL",
    modeLabel: hasAnyDurationData
      ? "Based on your logged earnings"
      : "Based on your logged earnings (duration missing - showing per-trip)",
    dataSource,
    minRecordsRequired: MIN_RECORDS_FOR_PERSONAL,
    currentRecordCount: totalRecords,
  };
}

function getConfidenceLevel(value: number): ConfidenceLevel {
  if (value >= 0.25) return "Strong";
  if (value >= 0.1) return "Medium";
  return "Weak";
}

function getConfidenceLevelFromSampleCount(sampleCount: number): ConfidenceLevel {
  const conf = getConfidenceFromSampleCount(sampleCount);
  if (conf >= 65) return "Strong";
  if (conf >= 35) return "Medium";
  return "Weak";
}

export function calculateDualRanking(
  mode: ScoringMode,
  logs: EarningsLog[],
  zoneId: string,
  zoneCategory: ZoneCategory,
  date: Date = new Date()
): DualRankingResult {
  if (mode === "PERSONAL") {
    const personalResult = scorePersonal(logs, zoneId, date);
    if (personalResult) {
      return personalResult;
    }
  }
  
  const demoResult = scoreDemo(zoneCategory, date);
  demoResult.currentRecordCount = logs.filter(l => l.zone === zoneId).length;
  return demoResult;
}

export function hasEnoughDataForPersonal(logs: EarningsLog[], zoneId: string): boolean {
  const zoneRecords = logs.filter(l => l.zone === zoneId);
  return zoneRecords.length >= MIN_RECORDS_FOR_PERSONAL;
}

export function getRecordCountForZone(logs: EarningsLog[], zoneId: string): number {
  return logs.filter(l => l.zone === zoneId).length;
}
