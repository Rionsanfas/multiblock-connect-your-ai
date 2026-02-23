-- Remove unique constraint on user_id (allow multiple connections per user)
ALTER TABLE openclaw_connections DROP CONSTRAINT IF EXISTS openclaw_connections_user_id_key;

-- Add connection name field
ALTER TABLE openclaw_connections ADD COLUMN IF NOT EXISTS connection_name TEXT NOT NULL DEFAULT 'My OpenClaw';

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_openclaw_connections_user_id ON openclaw_connections(user_id);