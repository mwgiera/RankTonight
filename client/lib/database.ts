import * as SQLite from "expo-sqlite";
import { nowMs, getBucket, type TimeRegime, type DayType } from "./time-buckets";
import type { Platform } from "./ranking-model";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync("driveradar.db");
  await db.execAsync("PRAGMA foreign_keys = ON;");
  await initSchema(db);
  return db;
}

async function initSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      startMs INTEGER NOT NULL,
      endMs INTEGER,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed'))
    );

    CREATE TABLE IF NOT EXISTS zone_dwells (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId INTEGER NOT NULL,
      zoneId TEXT NOT NULL,
      startMs INTEGER NOT NULL,
      endMs INTEGER,
      distanceEstKm REAL DEFAULT 0,
      timeRegime TEXT NOT NULL,
      dayType TEXT NOT NULL,
      FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId INTEGER,
      platform TEXT NOT NULL CHECK(platform IN ('uber', 'bolt', 'freenow')),
      pickupZone TEXT NOT NULL,
      destZone TEXT NOT NULL,
      fare REAL NOT NULL,
      etaMinutes REAL NOT NULL,
      distanceKm REAL,
      surgeFlag INTEGER DEFAULT 0,
      note TEXT,
      createdAtMs INTEGER NOT NULL,
      timeRegime TEXT NOT NULL,
      dayType TEXT NOT NULL,
      recommendationAction TEXT,
      recommendationConfidence TEXT,
      modelVersion TEXT DEFAULT 'v1',
      scoreComponents TEXT,
      feedback TEXT CHECK(feedback IS NULL OR feedback IN ('FOLLOWED', 'IGNORED')),
      actualFare REAL,
      actualDurationMin REAL,
      FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_offers_created ON offers(createdAtMs);
    CREATE INDEX IF NOT EXISTS idx_offers_bucket ON offers(destZone, timeRegime, dayType, platform);
    CREATE INDEX IF NOT EXISTS idx_dwells_session ON zone_dwells(sessionId);
    CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
  `);
}

export interface Session {
  id: number;
  startMs: number;
  endMs: number | null;
  status: "active" | "completed";
}

export interface ZoneDwell {
  id: number;
  sessionId: number;
  zoneId: string;
  startMs: number;
  endMs: number | null;
  distanceEstKm: number;
  timeRegime: TimeRegime;
  dayType: DayType;
}

export interface Offer {
  id: number;
  sessionId: number | null;
  platform: Platform;
  pickupZone: string;
  destZone: string;
  fare: number;
  etaMinutes: number;
  distanceKm: number | null;
  surgeFlag: boolean;
  note: string | null;
  createdAtMs: number;
  timeRegime: TimeRegime;
  dayType: DayType;
  recommendationAction: string | null;
  recommendationConfidence: string | null;
  modelVersion: string;
  scoreComponents: string | null;
  feedback: "FOLLOWED" | "IGNORED" | null;
  actualFare: number | null;
  actualDurationMin: number | null;
}

export async function startSession(): Promise<Session> {
  const database = await getDatabase();
  const existingActive = await database.getFirstAsync<Session>(
    "SELECT * FROM sessions WHERE status = 'active' LIMIT 1"
  );
  if (existingActive) {
    return existingActive;
  }

  const ts = nowMs();
  const result = await database.runAsync(
    "INSERT INTO sessions (startMs, status) VALUES (?, 'active')",
    [ts]
  );
  return {
    id: result.lastInsertRowId,
    startMs: ts,
    endMs: null,
    status: "active",
  };
}

export async function stopSession(sessionId: number): Promise<void> {
  const database = await getDatabase();
  const ts = nowMs();
  await database.runAsync(
    "UPDATE sessions SET endMs = ?, status = 'completed' WHERE id = ?",
    [ts, sessionId]
  );
  await database.runAsync(
    "UPDATE zone_dwells SET endMs = ? WHERE sessionId = ? AND endMs IS NULL",
    [ts, sessionId]
  );
}

export async function getActiveSession(): Promise<Session | null> {
  const database = await getDatabase();
  return database.getFirstAsync<Session>(
    "SELECT * FROM sessions WHERE status = 'active' LIMIT 1"
  );
}

export async function openDwell(sessionId: number, zoneId: string): Promise<ZoneDwell> {
  const database = await getDatabase();
  const ts = nowMs();
  const bucket = getBucket(ts);
  
  const result = await database.runAsync(
    `INSERT INTO zone_dwells (sessionId, zoneId, startMs, timeRegime, dayType) VALUES (?, ?, ?, ?, ?)`,
    [sessionId, zoneId, ts, bucket.timeRegime, bucket.dayType]
  );
  
  return {
    id: result.lastInsertRowId,
    sessionId,
    zoneId,
    startMs: ts,
    endMs: null,
    distanceEstKm: 0,
    timeRegime: bucket.timeRegime,
    dayType: bucket.dayType,
  };
}

export async function closeDwell(dwellId: number, distanceEstKm: number = 0): Promise<void> {
  const database = await getDatabase();
  const ts = nowMs();
  await database.runAsync(
    "UPDATE zone_dwells SET endMs = ?, distanceEstKm = ? WHERE id = ?",
    [ts, distanceEstKm, dwellId]
  );
}

export async function getOpenDwell(sessionId: number): Promise<ZoneDwell | null> {
  const database = await getDatabase();
  return database.getFirstAsync<ZoneDwell>(
    "SELECT * FROM zone_dwells WHERE sessionId = ? AND endMs IS NULL ORDER BY startMs DESC LIMIT 1",
    [sessionId]
  );
}

export async function getDwellsForSession(sessionId: number): Promise<ZoneDwell[]> {
  const database = await getDatabase();
  return database.getAllAsync<ZoneDwell>(
    "SELECT * FROM zone_dwells WHERE sessionId = ? ORDER BY startMs",
    [sessionId]
  );
}

export interface OfferInput {
  platform: Platform;
  pickupZone: string;
  destZone: string;
  fare: number;
  etaMinutes: number;
  distanceKm?: number;
  surgeFlag?: boolean;
  note?: string;
  recommendation?: {
    action: string;
    confidence: string;
    scoreComponents?: Record<string, number>;
  };
}

export async function saveOffer(input: OfferInput, sessionId?: number): Promise<Offer> {
  const database = await getDatabase();
  const ts = nowMs();
  const bucket = getBucket(ts);
  
  const result = await database.runAsync(
    `INSERT INTO offers (
      sessionId, platform, pickupZone, destZone, fare, etaMinutes, distanceKm,
      surgeFlag, note, createdAtMs, timeRegime, dayType,
      recommendationAction, recommendationConfidence, modelVersion, scoreComponents
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      sessionId ?? null,
      input.platform,
      input.pickupZone,
      input.destZone,
      input.fare,
      input.etaMinutes,
      input.distanceKm ?? null,
      input.surgeFlag ? 1 : 0,
      input.note ?? null,
      ts,
      bucket.timeRegime,
      bucket.dayType,
      input.recommendation?.action ?? null,
      input.recommendation?.confidence ?? null,
      "v1",
      input.recommendation?.scoreComponents ? JSON.stringify(input.recommendation.scoreComponents) : null,
    ]
  );
  
  return {
    id: result.lastInsertRowId,
    sessionId: sessionId ?? null,
    platform: input.platform,
    pickupZone: input.pickupZone,
    destZone: input.destZone,
    fare: input.fare,
    etaMinutes: input.etaMinutes,
    distanceKm: input.distanceKm ?? null,
    surgeFlag: input.surgeFlag ?? false,
    note: input.note ?? null,
    createdAtMs: ts,
    timeRegime: bucket.timeRegime,
    dayType: bucket.dayType,
    recommendationAction: input.recommendation?.action ?? null,
    recommendationConfidence: input.recommendation?.confidence ?? null,
    modelVersion: "v1",
    scoreComponents: input.recommendation?.scoreComponents ? JSON.stringify(input.recommendation.scoreComponents) : null,
    feedback: null,
    actualFare: null,
    actualDurationMin: null,
  };
}

export async function recordFeedback(
  offerId: number,
  feedback: "FOLLOWED" | "IGNORED",
  actualFare?: number,
  actualDurationMin?: number
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    "UPDATE offers SET feedback = ?, actualFare = ?, actualDurationMin = ? WHERE id = ?",
    [feedback, actualFare ?? null, actualDurationMin ?? null, offerId]
  );
}

export async function getRecentOffers(limit: number = 50): Promise<Offer[]> {
  const database = await getDatabase();
  return database.getAllAsync<Offer>(
    "SELECT * FROM offers ORDER BY createdAtMs DESC LIMIT ?",
    [limit]
  );
}

export interface BucketStats {
  platform: Platform;
  destZone: string;
  timeRegime: TimeRegime;
  dayType: DayType;
  sampleCount: number;
  avgRevPerHour: number;
  avgNextOfferWait: number | null;
  acceptanceRatio: number;
  recentSampleCount: number;
}

export async function getStatsForBucket(
  destZone: string,
  timeRegime: TimeRegime,
  dayType: DayType,
  platform: Platform
): Promise<BucketStats | null> {
  const database = await getDatabase();
  const thirtyDaysAgoMs = nowMs() - 30 * 24 * 60 * 60 * 1000;
  
  const result = await database.getFirstAsync<{
    total: number;
    recent: number;
    avgFare: number;
    avgEta: number;
    followed: number;
  }>(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN createdAtMs >= ? THEN 1 ELSE 0 END) as recent,
      AVG(fare) as avgFare,
      AVG(etaMinutes) as avgEta,
      SUM(CASE WHEN feedback = 'FOLLOWED' THEN 1 ELSE 0 END) as followed
    FROM offers 
    WHERE destZone = ? AND timeRegime = ? AND dayType = ? AND platform = ?`,
    [thirtyDaysAgoMs, destZone, timeRegime, dayType, platform]
  );
  
  if (!result || result.total === 0) return null;
  
  const avgRevPerHour = result.avgEta > 0 ? (result.avgFare / result.avgEta) * 60 : 0;
  
  return {
    platform,
    destZone,
    timeRegime,
    dayType,
    sampleCount: result.total,
    avgRevPerHour,
    avgNextOfferWait: null,
    acceptanceRatio: result.total > 0 ? result.followed / result.total : 0,
    recentSampleCount: result.recent,
  };
}

export interface MoneyProofCounters {
  baselineHourly: number;
  followedHourly: number;
  baselineCount: number;
  followedCount: number;
}

export async function getMoneyProofCounters(): Promise<MoneyProofCounters> {
  const database = await getDatabase();
  const twoHoursAgoMs = nowMs() - 2 * 60 * 60 * 1000;
  
  const baseline = await database.getFirstAsync<{ count: number; total: number; minutes: number }>(
    `SELECT 
      COUNT(*) as count,
      SUM(COALESCE(actualFare, fare)) as total,
      SUM(COALESCE(actualDurationMin, etaMinutes)) as minutes
    FROM offers 
    WHERE createdAtMs >= ? AND feedback IS NOT NULL`,
    [twoHoursAgoMs]
  );
  
  const followed = await database.getFirstAsync<{ count: number; total: number; minutes: number }>(
    `SELECT 
      COUNT(*) as count,
      SUM(COALESCE(actualFare, fare)) as total,
      SUM(COALESCE(actualDurationMin, etaMinutes)) as minutes
    FROM offers 
    WHERE createdAtMs >= ? AND feedback = 'FOLLOWED'`,
    [twoHoursAgoMs]
  );
  
  const baselineHourly = baseline && baseline.minutes > 0 
    ? (baseline.total / baseline.minutes) * 60 
    : 0;
  
  const followedHourly = followed && followed.minutes > 0 
    ? (followed.total / followed.minutes) * 60 
    : 0;
  
  return {
    baselineHourly,
    followedHourly,
    baselineCount: baseline?.count ?? 0,
    followedCount: followed?.count ?? 0,
  };
}

export async function deleteAllData(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync(`
    DELETE FROM zone_dwells;
    DELETE FROM offers;
    DELETE FROM sessions;
  `);
}

export async function exportAllDataAsCsv(): Promise<string> {
  const database = await getDatabase();
  const offers = await database.getAllAsync<Offer>("SELECT * FROM offers ORDER BY createdAtMs");
  
  const headers = [
    "id", "platform", "pickupZone", "destZone", "fare", "etaMinutes", "distanceKm",
    "surgeFlag", "createdAt", "timeRegime", "dayType", "recommendation", "confidence",
    "feedback", "actualFare", "actualDurationMin"
  ].join(",");
  
  const rows = offers.map((o: Offer) => [
    o.id,
    o.platform,
    o.pickupZone,
    o.destZone,
    o.fare,
    o.etaMinutes,
    o.distanceKm ?? "",
    o.surgeFlag ? "1" : "0",
    new Date(o.createdAtMs).toISOString(),
    o.timeRegime,
    o.dayType,
    o.recommendationAction ?? "",
    o.recommendationConfidence ?? "",
    o.feedback ?? "",
    o.actualFare ?? "",
    o.actualDurationMin ?? "",
  ].join(","));
  
  return [headers, ...rows].join("\n");
}
