import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { db } from "./db";
import { visitorLocations, adminSessions } from "@shared/schema";
import { desc, gt, eq } from "drizzle-orm";
import { randomBytes } from "crypto";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "driveradar2026";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

async function validateAdminToken(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const sessions = await db
      .select()
      .from(adminSessions)
      .where(eq(adminSessions.token, token));
    if (sessions.length === 0) return false;
    const session = sessions[0];
    return new Date(session.expiresAt) > new Date();
  } catch {
    return false;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/location", async (req: Request, res: Response) => {
    try {
      const { visitorId, latitude, longitude, zone } = req.body;
      if (!visitorId || latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      await db.insert(visitorLocations).values({
        visitorId,
        latitude,
        longitude,
        zone: zone || null,
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to save location:", error);
      res.status(500).json({ error: "Failed to save location" });
    }
  });

  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const { password } = req.body;
      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Invalid password" });
      }
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
      await db.insert(adminSessions).values({ token, expiresAt });
      res.json({ token, expiresAt: expiresAt.toISOString() });
    } catch (error) {
      console.error("Failed to create admin session:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.get("/api/admin/locations", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace("Bearer ", "");
      if (!token || !(await validateAdminToken(token))) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const locations = await db
        .select()
        .from(visitorLocations)
        .where(gt(visitorLocations.createdAt, oneDayAgo))
        .orderBy(desc(visitorLocations.createdAt))
        .limit(500);
      res.json({ locations });
    } catch (error) {
      console.error("Failed to fetch locations:", error);
      res.status(500).json({ error: "Failed to fetch locations" });
    }
  });

  app.get("/api/admin/stats", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace("Bearer ", "");
      if (!token || !(await validateAdminToken(token))) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const locations = await db
        .select()
        .from(visitorLocations)
        .where(gt(visitorLocations.createdAt, oneDayAgo));
      const uniqueVisitors = new Set(locations.map((l) => l.visitorId)).size;
      const zoneStats: Record<string, number> = {};
      locations.forEach((l) => {
        const z = l.zone || "unknown";
        zoneStats[z] = (zoneStats[z] || 0) + 1;
      });
      res.json({
        totalLocations: locations.length,
        uniqueVisitors,
        zoneStats,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
