import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";

const connectionString = process.env.POSTGRES_URL!;

const client = postgres(connectionString, {
  ssl: "require",
  max: 1,
});

export const db = drizzle(client, { schema });
