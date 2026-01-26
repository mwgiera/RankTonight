export type Platform = "bolt" | "uber" | "freenow";
export type ZoneCategory = "airport" | "center" | "residential";
export type ConfidenceLevel = "Strong" | "Medium" | "Weak";

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
}

export interface Zone {
  id: string;
  name: string;
  category: ZoneCategory;
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

type DayType = "WEEKDAY" | "WEEKEND";

/**
 * JS Date.getDay(): 0=Sun..6=Sat
 * Weekend = Sat/Sun
 * Weekend-like = Fri >= 20:00
 */
function getDayType(day: number, hour: number): DayType {
  const weekend = (day === 0 || day === 6);
  const fridayLate = (day === 5 && hour >= 20);
  return (weekend || fridayLate) ? "WEEKEND" : "WEEKDAY";
}

const SEASONALITY_MULTIPLIERS: Record<ZoneCategory, Record<number, Record<number, number>>> = {
  airport: generateSeasonalityTable("airport"),
  center: generateSeasonalityTable("center"),
  residential: generateSeasonalityTable("residential"),
};

function generateSeasonalityTable(category: ZoneCategory): Record<number, Record<number, number>> {
  const table: Record<number, Record<number, number>> = {};
  
  for (let day = 0; day < 7; day++) {
    table[day] = {};
    for (let hour = 0; hour < 24; hour++) {
      let multiplier = 1.0;
      
      if (category === "airport") {
        if (hour >= 5 && hour <= 9) multiplier = 1.8;
        else if (hour >= 16 && hour <= 20) multiplier = 1.6;
        else if (hour >= 0 && hour <= 4) multiplier = 0.6;
        else multiplier = 1.2;
      } else if (category === "center") {
        const dayType = getDayType(day, hour);

        if (dayType === "WEEKEND") {
          if (hour >= 20 || hour <= 2) multiplier = 2.0;
          else if (hour >= 12 && hour <= 18) multiplier = 1.5;
          else multiplier = 0.8;
        } else {
          if (hour >= 7 && hour <= 9) multiplier = 1.6;
          else if (hour >= 17 && hour <= 19) multiplier = 1.8;
          else if (hour >= 12 && hour <= 14) multiplier = 1.3;
          else if (hour >= 22 || hour <= 5) multiplier = 0.5;
          else multiplier = 1.0;
        }
      } else {
        if (hour >= 7 && hour <= 9) multiplier = 1.5;
        else if (hour >= 17 && hour <= 19) multiplier = 1.4;
        else if (hour >= 22 || hour <= 6) multiplier = 0.4;
        else multiplier = 0.9;
      }
      
      table[day][hour] = multiplier;
    }
  }
  
  return table;
}

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

interface PlatformPriors {
  incentive: Record<Platform, Record<ZoneCategory, number>>;
  reliability: Record<Platform, number>;
}

const platformPriors: PlatformPriors = {
  incentive: {
    bolt: { airport: 0.1, center: 0.2, residential: 0.15 },
    uber: { airport: 0.15, center: 0.1, residential: 0.1 },
    freenow: { airport: 0.05, center: 0.15, residential: 0.2 },
  },
  reliability: {
    bolt: 0.1,
    uber: 0.2,
    freenow: 0.0,
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
  
  const seasonality = SEASONALITY_MULTIPLIERS[zoneCategory][day][hour];
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
  
  return {
    rankings: platformScores,
    topPlatform: platformScores[0].platform,
    confidence,
    confidenceValue,
  };
}

export const ZONES: Zone[] = [
  { id: "airport", name: "Airport", category: "airport" },
  { id: "downtown", name: "Downtown", category: "center" },
  { id: "central-station", name: "Central Station", category: "center" },
  { id: "nightlife-district", name: "Nightlife District", category: "center" },
  { id: "business-park", name: "Business Park", category: "center" },
  { id: "north-suburbs", name: "North Suburbs", category: "residential" },
  { id: "south-suburbs", name: "South Suburbs", category: "residential" },
  { id: "west-side", name: "West Side", category: "residential" },
];

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
