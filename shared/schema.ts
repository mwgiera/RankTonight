import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, bigint, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const visitorLocations = pgTable("visitor_locations", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  visitorId: varchar("visitor_id").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  zone: varchar("zone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVisitorLocationSchema = createInsertSchema(visitorLocations).pick({
  visitorId: true,
  latitude: true,
  longitude: true,
  zone: true,
});

export type InsertVisitorLocation = z.infer<typeof insertVisitorLocationSchema>;
export type VisitorLocation = typeof visitorLocations.$inferSelect;

export const adminSessions = pgTable("admin_sessions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  token: varchar("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});
