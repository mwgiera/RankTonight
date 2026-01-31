import { getBucket, nowMs, type TimeRegime, type DayType } from "./time-buckets";
import { getZoneCategory, getZoneById, type ZoneDef } from "./zones";
import { getStatsForBucket, type BucketStats } from "./database";
import type { Platform, ZoneCategory } from "./ranking-model";

export type Confidence = "WEAK" | "MEDIUM" | "STRONG";
export type Action = "TAKE" | "DECLINE" | "WAIT" | "MOVE" | "COLLECT";

export interface PickRecommendation {
  mode: "PICK";
  action: "TAKE" | "DECLINE";
  platformHint?: Platform;
  confidence: "MEDIUM" | "STRONG";
  reasons: string[];
  stayUntilMin?: number;
  leaveIfMin?: number;
  suggestedZone?: string;
}

export interface GuideRecommendation {
  mode: "GUIDE";
  action: "WAIT" | "MOVE";
  confidence: "MEDIUM" | "STRONG";
  reasons: string[];
  stayUntilMin: number;
  leaveIfMin: number;
  suggestedZone?: string;
}

export interface CollectRecommendation {
  mode: "COLLECT";
  action: "COLLECT";
  confidence: "WEAK";
  neededSamples: number;
  instruction: string;
}

export type Recommendation = PickRecommendation | GuideRecommendation | CollectRecommendation;

export interface DriverSettings {
  targetHourlyPln: number;
  costPerKmPln: number;
  tolerancePercent: number;
  riskPreference: number;
}

export const DEFAULT_DRIVER_SETTINGS: DriverSettings = {
  targetHourlyPln: 90,
  costPerKmPln: 0.70,
  tolerancePercent: 0.10,
  riskPreference: 0.5,
};

export interface OfferInput {
  platform: Platform;
  pickupZone: string;
  destZone: string;
  fare: number;
  etaMinutes: number;
  distanceKm?: number;
}

export interface ScoreComponents {
  effectiveHourly: number;
  postDestHourly: number;
  totalScore: number;
  estCosts: number;
  netFare: number;
}

const ESTIMATED_SPEED_KM_PER_MIN = 0.45;
const MIN_SAMPLES_FOR_RECOMMENDATION = 5;
const STRONG_SAMPLE_THRESHOLD = 15;

function getConfidenceLevel(sampleCount: number): Confidence {
  if (sampleCount < MIN_SAMPLES_FOR_RECOMMENDATION) return "WEAK";
  if (sampleCount < STRONG_SAMPLE_THRESHOLD) return "MEDIUM";
  return "STRONG";
}

function getConfidenceValue(sampleCount: number): number {
  if (sampleCount < MIN_SAMPLES_FOR_RECOMMENDATION) return 0.35 * (sampleCount / MIN_SAMPLES_FOR_RECOMMENDATION);
  if (sampleCount < STRONG_SAMPLE_THRESHOLD) {
    return 0.35 + 0.30 * ((sampleCount - MIN_SAMPLES_FOR_RECOMMENDATION) / (STRONG_SAMPLE_THRESHOLD - MIN_SAMPLES_FOR_RECOMMENDATION));
  }
  return Math.min(0.85, 0.65 + 0.20 * Math.min((sampleCount - STRONG_SAMPLE_THRESHOLD) / 15, 1));
}

function calculateEffectiveHourly(
  fare: number,
  etaMinutes: number,
  distanceKm: number | undefined,
  settings: DriverSettings
): { effectiveHourly: number; estCosts: number; netFare: number } {
  const estimatedDistance = distanceKm ?? etaMinutes * ESTIMATED_SPEED_KM_PER_MIN;
  const estCosts = settings.costPerKmPln * estimatedDistance;
  const netFare = fare - estCosts;
  const effectiveHourly = etaMinutes > 0 ? (netFare / etaMinutes) * 60 : 0;
  
  return { effectiveHourly, estCosts, netFare };
}

export async function scoreOffer(
  offer: OfferInput,
  settings: DriverSettings = DEFAULT_DRIVER_SETTINGS
): Promise<{ recommendation: Recommendation; scoreComponents: ScoreComponents }> {
  const bucket = getBucket(nowMs());
  
  const stats = await getStatsForBucket(
    offer.destZone,
    bucket.timeRegime,
    bucket.dayType,
    offer.platform
  );
  
  const sampleCount = stats?.sampleCount ?? 0;
  const confidence = getConfidenceLevel(sampleCount);
  
  const { effectiveHourly, estCosts, netFare } = calculateEffectiveHourly(
    offer.fare,
    offer.etaMinutes,
    offer.distanceKm,
    settings
  );
  
  const postDestHourly = stats?.avgRevPerHour ?? 0;
  const postDestWeight = confidence === "WEAK" ? 0 : confidence === "MEDIUM" ? 0.2 : 0.3;
  const effectiveWeight = 1 - postDestWeight;
  
  const totalScore = effectiveWeight * effectiveHourly + postDestWeight * postDestHourly;
  
  const scoreComponents: ScoreComponents = {
    effectiveHourly,
    postDestHourly,
    totalScore,
    estCosts,
    netFare,
  };
  
  if (confidence === "WEAK") {
    const neededSamples = MIN_SAMPLES_FOR_RECOMMENDATION - sampleCount;
    const recommendation: CollectRecommendation = {
      mode: "COLLECT",
      action: "COLLECT",
      confidence: "WEAK",
      neededSamples,
      instruction: `Log ${neededSamples} more trips to ${offer.destZone} to get personalized recommendations`,
    };
    return { recommendation, scoreComponents };
  }
  
  const minAcceptableHourly = settings.targetHourlyPln * (1 - settings.tolerancePercent);
  const shouldTake = totalScore >= minAcceptableHourly;
  
  const reasons: string[] = [];
  
  if (shouldTake) {
    reasons.push(`Expected ${Math.round(totalScore)} PLN/h meets your ${Math.round(minAcceptableHourly)} PLN/h target`);
    if (postDestWeight > 0 && postDestHourly > 0) {
      reasons.push(`${offer.destZone} historically yields ${Math.round(postDestHourly)} PLN/h`);
    }
  } else {
    reasons.push(`Expected ${Math.round(totalScore)} PLN/h is below your ${Math.round(minAcceptableHourly)} PLN/h target`);
    if (estCosts > offer.fare * 0.3) {
      reasons.push(`High estimated costs: ${Math.round(estCosts)} PLN`);
    }
  }
  
  const destZone = getZoneById(offer.destZone);
  
  const recommendation: PickRecommendation = {
    mode: "PICK",
    action: shouldTake ? "TAKE" : "DECLINE",
    platformHint: offer.platform,
    confidence: confidence as "MEDIUM" | "STRONG",
    reasons,
    stayUntilMin: destZone?.defaultStayUntilMin,
    leaveIfMin: destZone?.defaultLeaveIfMin,
    suggestedZone: destZone?.suggestedNextZones[0],
  };
  
  return { recommendation, scoreComponents };
}

export async function getIdleRecommendation(
  currentZoneId: string | null,
  dwellMinutes: number,
  settings: DriverSettings = DEFAULT_DRIVER_SETTINGS
): Promise<Recommendation> {
  if (!currentZoneId) {
    return {
      mode: "COLLECT",
      action: "COLLECT",
      confidence: "WEAK",
      neededSamples: 5,
      instruction: "Enable location to get zone-based recommendations",
    };
  }
  
  const zone = getZoneById(currentZoneId);
  if (!zone) {
    return {
      mode: "COLLECT",
      action: "COLLECT",
      confidence: "WEAK",
      neededSamples: 5,
      instruction: "Zone not recognized. Log trips to build data.",
    };
  }
  
  const bucket = getBucket(nowMs());
  
  let totalSamples = 0;
  const platforms: Platform[] = ["uber", "bolt", "freenow"];
  for (const p of platforms) {
    const stats = await getStatsForBucket(currentZoneId, bucket.timeRegime, bucket.dayType, p);
    totalSamples += stats?.sampleCount ?? 0;
  }
  
  const confidence = getConfidenceLevel(totalSamples);
  
  if (confidence === "WEAK") {
    return {
      mode: "COLLECT",
      action: "COLLECT",
      confidence: "WEAK",
      neededSamples: MIN_SAMPLES_FOR_RECOMMENDATION - totalSamples,
      instruction: `Log ${MIN_SAMPLES_FOR_RECOMMENDATION - totalSamples} trips from ${zone.name} to build recommendations`,
    };
  }
  
  const shouldMove = dwellMinutes >= zone.defaultLeaveIfMin;
  const shouldWait = dwellMinutes < zone.defaultStayUntilMin;
  
  const reasons: string[] = [];
  
  if (shouldMove) {
    reasons.push(`You've been in ${zone.name} for ${Math.round(dwellMinutes)} min (leave threshold: ${zone.defaultLeaveIfMin} min)`);
    reasons.push(`Consider moving to ${zone.suggestedNextZones[0]}`);
    
    return {
      mode: "GUIDE",
      action: "MOVE",
      confidence: confidence as "MEDIUM" | "STRONG",
      reasons,
      stayUntilMin: zone.defaultStayUntilMin,
      leaveIfMin: zone.defaultLeaveIfMin,
      suggestedZone: zone.suggestedNextZones[0],
    };
  }
  
  if (shouldWait) {
    reasons.push(`Wait up to ${zone.defaultStayUntilMin} min in ${zone.name}`);
    reasons.push(`Zone bias: ${zone.primaryBias}`);
  } else {
    reasons.push(`In ${zone.name} for ${Math.round(dwellMinutes)} min`);
    reasons.push(`Consider leaving after ${zone.defaultLeaveIfMin} min if no offers`);
  }
  
  return {
    mode: "GUIDE",
    action: "WAIT",
    confidence: confidence as "MEDIUM" | "STRONG",
    reasons,
    stayUntilMin: zone.defaultStayUntilMin,
    leaveIfMin: zone.defaultLeaveIfMin,
    suggestedZone: zone.suggestedNextZones[0],
  };
}

export function formatRecommendationForDisplay(rec: Recommendation): {
  primaryAction: string;
  secondaryText: string;
  confidenceLabel: string;
} {
  if (rec.mode === "COLLECT") {
    return {
      primaryAction: "COLLECT DATA",
      secondaryText: rec.instruction,
      confidenceLabel: "Insufficient Data",
    };
  }
  
  if (rec.mode === "PICK") {
    return {
      primaryAction: rec.action,
      secondaryText: rec.reasons[0] ?? "",
      confidenceLabel: rec.confidence === "STRONG" ? "High Confidence" : "Moderate Confidence",
    };
  }
  
  return {
    primaryAction: rec.action,
    secondaryText: rec.reasons[0] ?? "",
    confidenceLabel: rec.confidence === "STRONG" ? "High Confidence" : "Moderate Confidence",
  };
}
