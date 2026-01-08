-- Migration: Add activity_cache table
-- Date: 2026-01-07
-- Purpose: Cache transaction activity data to improve performance

CREATE TABLE IF NOT EXISTS activity_cache (
  id SERIAL PRIMARY KEY,
  address VARCHAR(42) NOT NULL UNIQUE,
  activities_json TEXT NOT NULL,
  max_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on address for faster lookups
CREATE INDEX IF NOT EXISTS idx_activity_cache_address ON activity_cache(address);

-- Create index on updated_at for cache expiration queries
CREATE INDEX IF NOT EXISTS idx_activity_cache_updated_at ON activity_cache(updated_at);

-- Verify table was created
SELECT 'activity_cache table created successfully' as status;

