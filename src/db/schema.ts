import { pgTable, serial, varchar, timestamp, text, integer } from "drizzle-orm/pg-core";

// Network connections table - stores identity relationships
export const edges = pgTable("edges", {
  id: serial("id").primaryKey(),
  source: varchar("source", { length: 255 }).notNull(), // Source identity (ENS name)
  target: varchar("target", { length: 255 }).notNull(), // Target identity (ENS name)
  createdAt: timestamp("created_at").defaultNow(),
});

// Activity cache table - performance optimization for on-chain analytics
export const activityCache = pgTable("activity_cache", {
  id: serial("id").primaryKey(),
  address: varchar("address", { length: 42 }).notNull().unique(), // Ethereum address
  activitiesJson: text("activities_json").notNull(), // 365 days of activity data (JSON)
  maxCount: integer("max_count").notNull().default(0), // Max transaction count for scaling
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(), // For cache expiration (24h)
});
