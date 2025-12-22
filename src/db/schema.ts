import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";

export const edges = pgTable("edges", {
  id: serial("id").primaryKey(),
  source: varchar("source", { length: 255 }).notNull(),
  target: varchar("target", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
