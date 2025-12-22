import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";

// Use POSTGRES_URL from Supabase/Vercel
const connectionString = process.env.POSTGRES_URL!;

// Create postgres client (use ssl for production)
const client = postgres(connectionString, { 
  ssl: process.env.NODE_ENV === "production" ? "require" : false,
  max: 1 // Limit connections for serverless
});

export const db = drizzle(client, { schema });
