-- Add Mission System to Matches
-- Each match gets 3 random missions to complete together

-- Add mission tracking columns
ALTER TABLE matches ADD COLUMN IF NOT EXISTS mission_1_id INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS mission_2_id INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS mission_3_id INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS mission_number INTEGER DEFAULT 1;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS mission_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS mission_completed_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for faster mission queries
CREATE INDEX IF NOT EXISTS idx_matches_mission_number ON matches(mission_number);
CREATE INDEX IF NOT EXISTS idx_matches_completed ON matches(mission_completed);

-- Verify changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'matches' 
ORDER BY ordinal_position;
